/**
 * Feature Update Scheduler
 * 
 * Manages monthly feature update schedule and rollout
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { config } from '../config/env';

interface FeatureUpdate {
  id: string;
  name: string;
  description: string;
  version: string;
  releaseDate: string;
  features: Feature[];
  rolloutPercentage: number;
  status: 'scheduled' | 'rolling_out' | 'completed' | 'paused';
}

interface Feature {
  id: string;
  name: string;
  description: string;
  category: 'new' | 'improvement' | 'bugfix';
  enabled: boolean;
}

interface UpdateSchedule {
  updates: FeatureUpdate[];
  lastChecked: Date;
}

export class FeatureUpdateScheduler {
  private static instance: FeatureUpdateScheduler;
  private readonly API_BASE_URL = config.OTA_API_BASE_URL;
  private readonly STORAGE_KEY = 'feature_update_schedule';
  private readonly CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  static getInstance(): FeatureUpdateScheduler {
    if (!FeatureUpdateScheduler.instance) {
      FeatureUpdateScheduler.instance = new FeatureUpdateScheduler();
    }
    return FeatureUpdateScheduler.instance;
  }

  /**
   * Initialize feature update scheduler
   */
  async initialize(): Promise<void> {
    await this.checkForFeatureUpdates();
    this.startScheduledChecks();
  }

  /**
   * Check for scheduled feature updates
   */
  async checkForFeatureUpdates(): Promise<FeatureUpdate[]> {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/features/schedule`, {
        timeout: 10000,
      });

      const updates: FeatureUpdate[] = response.data.updates || [];
      await this.saveSchedule(updates);

      // Process updates that are ready for rollout
      for (const update of updates) {
        if (this.isReadyForRollout(update)) {
          await this.processUpdate(update);
        }
      }

      return updates;
    } catch (error) {
      console.error('Failed to check for feature updates:', error);
      return [];
    }
  }

  /**
   * Check if update is ready for rollout
   */
  private isReadyForRollout(update: FeatureUpdate): boolean {
    const releaseDate = new Date(update.releaseDate);
    const now = new Date();
    
    return (
      update.status === 'scheduled' &&
      releaseDate <= now
    );
  }

  /**
   * Process a feature update
   */
  private async processUpdate(update: FeatureUpdate): Promise<void> {
    console.log(`Processing feature update: ${update.name}`);

    try {
      // Check if user is in rollout group
      const isInRollout = await this.isUserInRollout(update);
      if (!isInRollout) {
        console.log('User not in rollout group');
        return;
      }

      // Enable features
      for (const feature of update.features) {
        await this.enableFeature(feature);
      }

      // Mark update as completed for this user
      await this.markUpdateCompleted(update.id);

      console.log(`Feature update ${update.name} completed`);
    } catch (error) {
      console.error(`Failed to process update ${update.id}:`, error);
    }
  }

  /**
   * Check if user is in rollout group
   */
  private async isUserInRollout(update: FeatureUpdate): Promise<boolean> {
    const userId = await this.getUserId();
    const hash = this.hashUserId(userId + update.id);
    const bucket = hash % 100;
    
    return bucket < update.rolloutPercentage;
  }

  /**
   * Enable a feature
   */
  private async enableFeature(feature: Feature): Promise<void> {
    const key = `feature_${feature.id}`;
    await AsyncStorage.setItem(key, JSON.stringify({
      ...feature,
      enabledAt: new Date(),
    }));
  }

  /**
   * Check if feature is enabled
   */
  async isFeatureEnabled(featureId: string): Promise<boolean> {
    try {
      const key = `feature_${featureId}`;
      const featureJson = await AsyncStorage.getItem(key);
      if (!featureJson) {
        return false;
      }

      const feature = JSON.parse(featureJson);
      return feature.enabled;
    } catch (error) {
      console.error(`Failed to check feature ${featureId}:`, error);
      return false;
    }
  }

  /**
   * Get all enabled features
   */
  async getEnabledFeatures(): Promise<Feature[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const featureKeys = keys.filter((key: string) => key.startsWith('feature_'));
      
      const features: Feature[] = [];
      for (const key of featureKeys) {
        const featureJson = await AsyncStorage.getItem(key);
        if (featureJson) {
          const feature = JSON.parse(featureJson);
          if (feature.enabled) {
            features.push(feature);
          }
        }
      }

      return features;
    } catch (error) {
      console.error('Failed to get enabled features:', error);
      return [];
    }
  }

  /**
   * Get upcoming feature updates
   */
  async getUpcomingUpdates(): Promise<FeatureUpdate[]> {
    const schedule = await this.loadSchedule();
    const now = new Date();

    return schedule.updates.filter(update => {
      const releaseDate = new Date(update.releaseDate);
      return releaseDate > now && update.status === 'scheduled';
    });
  }

  /**
   * Get completed updates
   */
  async getCompletedUpdates(): Promise<string[]> {
    try {
      const completedJson = await AsyncStorage.getItem('completed_updates');
      return completedJson ? JSON.parse(completedJson) : [];
    } catch (error) {
      console.error('Failed to get completed updates:', error);
      return [];
    }
  }

  /**
   * Mark update as completed
   */
  private async markUpdateCompleted(updateId: string): Promise<void> {
    try {
      const completed = await this.getCompletedUpdates();
      completed.push(updateId);
      await AsyncStorage.setItem('completed_updates', JSON.stringify(completed));
    } catch (error) {
      console.error('Failed to mark update completed:', error);
    }
  }

  /**
   * Save update schedule
   */
  private async saveSchedule(updates: FeatureUpdate[]): Promise<void> {
    try {
      const schedule: UpdateSchedule = {
        updates,
        lastChecked: new Date(),
      };
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(schedule));
    } catch (error) {
      console.error('Failed to save schedule:', error);
    }
  }

  /**
   * Load update schedule
   */
  private async loadSchedule(): Promise<UpdateSchedule> {
    try {
      const scheduleJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (scheduleJson) {
        return JSON.parse(scheduleJson);
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }

    return {
      updates: [],
      lastChecked: new Date(0),
    };
  }

  /**
   * Start scheduled checks
   */
  private startScheduledChecks(): void {
    setInterval(async () => {
      await this.checkForFeatureUpdates();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Hash user ID for consistent rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Get user ID
   */
  private async getUserId(): Promise<string> {
    const userId = await AsyncStorage.getItem('user_id');
    return userId || 'anonymous';
  }

  /**
   * Get feature update history
   */
  async getUpdateHistory(): Promise<FeatureUpdate[]> {
    const schedule = await this.loadSchedule();
    const completed = await this.getCompletedUpdates();

    return schedule.updates.filter(update => 
      completed.includes(update.id)
    );
  }

  /**
   * Get next scheduled update
   */
  async getNextUpdate(): Promise<FeatureUpdate | null> {
    const upcoming = await this.getUpcomingUpdates();
    if (upcoming.length === 0) {
      return null;
    }

    // Sort by release date
    upcoming.sort((a, b) => 
      new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
    );

    return upcoming[0];
  }

  /**
   * Get days until next update
   */
  async getDaysUntilNextUpdate(): Promise<number | null> {
    const nextUpdate = await this.getNextUpdate();
    if (!nextUpdate) {
      return null;
    }

    const releaseDate = new Date(nextUpdate.releaseDate);
    const now = new Date();
    const diffTime = releaseDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Clear all feature data (for testing)
   */
  async clearAllData(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const featureKeys = keys.filter((key: string) => 
      key.startsWith('feature_') || 
      key === this.STORAGE_KEY ||
      key === 'completed_updates'
    );
    
    // Remove each key individually
    for (const key of featureKeys) {
      await AsyncStorage.removeItem(key);
    }
  }
}

export default FeatureUpdateScheduler.getInstance();
