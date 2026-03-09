/**
 * A/B Testing Service
 * 
 * Enables testing of new features and recommendation algorithms
 * with a subset of users before full rollout.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { config } from '../config/env';

interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABVariant[];
  startDate: string;
  endDate: string;
  targetPercentage: number;
  status: 'active' | 'paused' | 'completed';
  metrics: string[];
}

interface ABVariant {
  id: string;
  name: string;
  description: string;
  percentage: number;
  config: any;
}

interface UserAssignment {
  testId: string;
  variantId: string;
  assignedAt: Date;
}

interface ABTestResult {
  testId: string;
  variantId: string;
  metric: string;
  value: number;
  timestamp: Date;
}

export class ABTestingService {
  private static instance: ABTestingService;
  private readonly API_BASE_URL = config.OTA_API_BASE_URL;
  private readonly STORAGE_KEY = 'ab_test_assignments';
  private userAssignments: Map<string, UserAssignment> = new Map();

  private constructor() {}

  static getInstance(): ABTestingService {
    if (!ABTestingService.instance) {
      ABTestingService.instance = new ABTestingService();
    }
    return ABTestingService.instance;
  }

  /**
   * Initialize A/B testing service
   */
  async initialize(): Promise<void> {
    await this.loadUserAssignments();
    await this.syncActiveTests();
  }

  /**
   * Get active A/B tests from server
   */
  async syncActiveTests(): Promise<ABTest[]> {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/ab-tests/active`, {
        timeout: 10000,
      });

      return response.data.tests || [];
    } catch (error) {
      console.error('Failed to sync A/B tests:', error);
      return [];
    }
  }

  /**
   * Get variant for a specific test
   */
  async getVariant(testId: string): Promise<string | null> {
    // Check if user is already assigned
    const assignment = this.userAssignments.get(testId);
    if (assignment) {
      return assignment.variantId;
    }

    // Get test configuration
    const test = await this.getTest(testId);
    if (!test || test.status !== 'active') {
      return null;
    }

    // Check if user should be included in test
    const userId = await this.getUserId();
    const shouldInclude = this.shouldIncludeUser(userId, test.targetPercentage);
    if (!shouldInclude) {
      return null;
    }

    // Assign user to variant
    const variantId = this.assignVariant(userId, test);
    await this.saveAssignment(testId, variantId);

    return variantId;
  }

  /**
   * Check if a feature is enabled for the user
   */
  async isFeatureEnabled(featureName: string): Promise<boolean> {
    const variant = await this.getVariant(featureName);
    return variant === 'enabled' || variant === 'treatment';
  }

  /**
   * Get configuration for a variant
   */
  async getVariantConfig(testId: string): Promise<any> {
    const variantId = await this.getVariant(testId);
    if (!variantId) {
      return null;
    }

    const test = await this.getTest(testId);
    if (!test) {
      return null;
    }

    const variant = test.variants.find(v => v.id === variantId);
    return variant?.config || null;
  }

  /**
   * Track A/B test metric
   */
  async trackMetric(testId: string, metric: string, value: number): Promise<void> {
    const variantId = await this.getVariant(testId);
    if (!variantId) {
      return;
    }

    const result: ABTestResult = {
      testId,
      variantId,
      metric,
      value,
      timestamp: new Date(),
    };

    try {
      await axios.post(`${this.API_BASE_URL}/ab-tests/metrics`, result, {
        timeout: 5000,
      });
    } catch (error) {
      console.error('Failed to track A/B test metric:', error);
      // Store locally for later sync
      await this.storeMetricLocally(result);
    }
  }

  /**
   * Track recommendation acceptance (for recommendation A/B tests)
   */
  async trackRecommendationAcceptance(
    testId: string,
    recommendationType: string,
    accepted: boolean
  ): Promise<void> {
    await this.trackMetric(
      testId,
      `${recommendationType}_acceptance`,
      accepted ? 1 : 0
    );
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(testId: string, featureName: string): Promise<void> {
    await this.trackMetric(testId, `${featureName}_usage`, 1);
  }

  /**
   * Get test configuration
   */
  private async getTest(testId: string): Promise<ABTest | null> {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/ab-tests/${testId}`, {
        timeout: 5000,
      });

      return response.data.test || null;
    } catch (error) {
      console.error(`Failed to get test ${testId}:`, error);
      return null;
    }
  }

  /**
   * Determine if user should be included in test
   */
  private shouldIncludeUser(userId: string, targetPercentage: number): boolean {
    // Use consistent hashing to determine inclusion
    const hash = this.hashUserId(userId);
    const bucket = hash % 100;
    return bucket < targetPercentage;
  }

  /**
   * Assign user to a variant
   */
  private assignVariant(userId: string, test: ABTest): string {
    // Use consistent hashing to assign variant
    const hash = this.hashUserId(userId + test.id);
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.percentage;
      if (hash % 100 < cumulative) {
        return variant.id;
      }
    }

    // Fallback to control variant
    return test.variants[0].id;
  }

  /**
   * Hash user ID for consistent assignment
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Save user assignment
   */
  private async saveAssignment(testId: string, variantId: string): Promise<void> {
    const assignment: UserAssignment = {
      testId,
      variantId,
      assignedAt: new Date(),
    };

    this.userAssignments.set(testId, assignment);
    await this.persistAssignments();

    // Report assignment to server
    try {
      await axios.post(`${this.API_BASE_URL}/ab-tests/assignments`, {
        userId: await this.getUserId(),
        testId,
        variantId,
        assignedAt: assignment.assignedAt,
      });
    } catch (error) {
      console.error('Failed to report assignment:', error);
    }
  }

  /**
   * Load user assignments from storage
   */
  private async loadUserAssignments(): Promise<void> {
    try {
      const assignmentsJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (assignmentsJson) {
        const assignments = JSON.parse(assignmentsJson);
        this.userAssignments = new Map(Object.entries(assignments));
      }
    } catch (error) {
      console.error('Failed to load user assignments:', error);
    }
  }

  /**
   * Persist user assignments to storage
   */
  private async persistAssignments(): Promise<void> {
    try {
      const assignments = Object.fromEntries(this.userAssignments);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(assignments));
    } catch (error) {
      console.error('Failed to persist assignments:', error);
    }
  }

  /**
   * Store metric locally for later sync
   */
  private async storeMetricLocally(result: ABTestResult): Promise<void> {
    try {
      const key = 'ab_test_metrics_pending';
      const existingJson = await AsyncStorage.getItem(key);
      const existing = existingJson ? JSON.parse(existingJson) : [];
      existing.push(result);
      await AsyncStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to store metric locally:', error);
    }
  }

  /**
   * Sync pending metrics
   */
  async syncPendingMetrics(): Promise<void> {
    try {
      const key = 'ab_test_metrics_pending';
      const metricsJson = await AsyncStorage.getItem(key);
      if (!metricsJson) {
        return;
      }

      const metrics = JSON.parse(metricsJson);
      if (metrics.length === 0) {
        return;
      }

      await axios.post(`${this.API_BASE_URL}/ab-tests/metrics/batch`, {
        metrics,
      });

      // Clear pending metrics
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to sync pending metrics:', error);
    }
  }

  /**
   * Get user ID
   */
  private async getUserId(): Promise<string> {
    // In production, get from auth service
    const userId = await AsyncStorage.getItem('user_id');
    return userId || 'anonymous';
  }

  /**
   * Clear all A/B test data (for testing)
   */
  async clearAllData(): Promise<void> {
    this.userAssignments.clear();
    await AsyncStorage.removeItem(this.STORAGE_KEY);
    await AsyncStorage.removeItem('ab_test_metrics_pending');
  }
}

export default ABTestingService.getInstance();
