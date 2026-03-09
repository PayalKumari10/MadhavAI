/**
 * Version Compatibility Service
 *
 * Ensures backward compatibility for 2 previous versions
 * Handles API versioning and graceful degradation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { config } from '../config/env';

interface VersionInfo {
  current: string;
  minimum: string;
  recommended: string;
  deprecated: string[];
}

export class VersionCompatibilityService {
  private static instance: VersionCompatibilityService;
  private readonly API_BASE_URL = config.OTA_API_BASE_URL;
  private readonly STORAGE_KEY = 'version_info';
  private currentVersion: string = '1.0.0';

  private constructor() {}

  static getInstance(): VersionCompatibilityService {
    if (!VersionCompatibilityService.instance) {
      VersionCompatibilityService.instance = new VersionCompatibilityService();
    }
    return VersionCompatibilityService.instance;
  }

  /**
   * Initialize version compatibility service
   */
  async initialize(): Promise<void> {
    await this.loadVersionInfo();
    await this.checkCompatibility();
  }

  /**
   * Check if current version is compatible
   */
  async checkCompatibility(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/version/check`, {
        params: {
          version: this.currentVersion,
        },
        timeout: 10000,
      });

      const versionInfo: VersionInfo = response.data;
      await this.saveVersionInfo(versionInfo);

      // Check if version is deprecated
      if (versionInfo.deprecated.includes(this.currentVersion)) {
        console.warn('Current version is deprecated');
        return false;
      }

      // Check if version meets minimum requirement
      if (this.compareVersions(this.currentVersion, versionInfo.minimum) < 0) {
        console.error('Current version is below minimum requirement');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to check version compatibility:', error);
      // Allow app to continue if check fails
      return true;
    }
  }

  /**
   * Get API version to use based on app version
   */
  getAPIVersion(): string {
    // Map app versions to API versions
    const versionMap: { [key: string]: string } = {
      '1.0.0': 'v1',
      '1.1.0': 'v1',
      '1.2.0': 'v2',
      '2.0.0': 'v2',
    };

    return versionMap[this.currentVersion] || 'v1';
  }

  /**
   * Get API endpoint with version
   */
  getAPIEndpoint(endpoint: string): string {
    const apiVersion = this.getAPIVersion();
    return `${this.API_BASE_URL}/${apiVersion}${endpoint}`;
  }

  /**
   * Check if feature is supported in current version
   */
  isFeatureSupported(feature: string): boolean {
    const featureVersions: { [key: string]: string } = {
      voice_interface: '1.0.0',
      offline_mode: '1.0.0',
      crop_recommendations: '1.0.0',
      market_prices: '1.0.0',
      weather_forecast: '1.0.0',
      government_schemes: '1.0.0',
      training_lessons: '1.0.0',
      soil_health: '1.1.0',
      pest_detection: '1.2.0',
      yield_prediction: '2.0.0',
    };

    const requiredVersion = featureVersions[feature];
    if (!requiredVersion) {
      return false;
    }

    return this.compareVersions(this.currentVersion, requiredVersion) >= 0;
  }

  /**
   * Get fallback behavior for unsupported features
   */
  getFallbackBehavior(feature: string): string {
    const fallbacks: { [key: string]: string } = {
      soil_health: 'Show basic soil information without advanced analysis',
      pest_detection: 'Redirect to training lessons on pest management',
      yield_prediction: 'Show historical yield data instead of predictions',
    };

    return fallbacks[feature] || 'Feature not available in this version';
  }

  /**
   * Transform API response for backward compatibility
   */
  transformResponse(endpoint: string, response: any, targetVersion: string): any {
    // Handle API response transformations for older versions
    if (endpoint.includes('/recommendations') && targetVersion === '1.0.0') {
      // Transform v2 response to v1 format
      return this.transformRecommendationsV2toV1(response);
    }

    if (endpoint.includes('/schemes') && targetVersion === '1.0.0') {
      // Transform v2 response to v1 format
      return this.transformSchemesV2toV1(response);
    }

    return response;
  }

  /**
   * Transform recommendations from v2 to v1 format
   */
  private transformRecommendationsV2toV1(response: any): any {
    // v2 has nested structure, v1 expects flat structure
    if (response.recommendations && Array.isArray(response.recommendations)) {
      return {
        crops: response.recommendations.map((r: any) => ({
          name: r.cropName,
          score: r.suitabilityScore,
          reason: r.explanation?.reasoning || '',
        })),
      };
    }
    return response;
  }

  /**
   * Transform schemes from v2 to v1 format
   */
  private transformSchemesV2toV1(response: any): any {
    // v2 has additional fields, v1 expects basic fields only
    if (response.schemes && Array.isArray(response.schemes)) {
      return {
        schemes: response.schemes.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          eligible: s.eligibility?.eligible || false,
        })),
      };
    }
    return response;
  }

  /**
   * Compare two version strings
   * Returns: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }

  /**
   * Load version info from storage
   */
  private async loadVersionInfo(): Promise<void> {
    try {
      const versionInfoJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (versionInfoJson) {
        // Parse and use stored version info if available
        JSON.parse(versionInfoJson);
      }
    } catch (error) {
      console.error('Failed to load version info:', error);
    }
  }

  /**
   * Save version info to storage
   */
  private async saveVersionInfo(versionInfo: VersionInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(versionInfo));
    } catch (error) {
      console.error('Failed to save version info:', error);
    }
  }

  /**
   * Get current app version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Set current app version (for testing)
   */
  setCurrentVersion(version: string): void {
    this.currentVersion = version;
  }

  /**
   * Check if update is required
   */
  async isUpdateRequired(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/version/check`, {
        params: {
          version: this.currentVersion,
        },
        timeout: 10000,
      });

      const versionInfo: VersionInfo = response.data;

      // Update required if current version is below minimum
      return this.compareVersions(this.currentVersion, versionInfo.minimum) < 0;
    } catch (error) {
      console.error('Failed to check if update is required:', error);
      return false;
    }
  }

  /**
   * Check if update is recommended
   */
  async isUpdateRecommended(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.API_BASE_URL}/version/check`, {
        params: {
          version: this.currentVersion,
        },
        timeout: 10000,
      });

      const versionInfo: VersionInfo = response.data;

      // Update recommended if current version is below recommended
      return this.compareVersions(this.currentVersion, versionInfo.recommended) < 0;
    } catch (error) {
      console.error('Failed to check if update is recommended:', error);
      return false;
    }
  }

  /**
   * Get supported API versions
   */
  getSupportedAPIVersions(): string[] {
    // Current version supports these API versions
    const versionSupport: { [key: string]: string[] } = {
      '1.0.0': ['v1'],
      '1.1.0': ['v1'],
      '1.2.0': ['v1', 'v2'],
      '2.0.0': ['v2'],
    };

    return versionSupport[this.currentVersion] || ['v1'];
  }

  /**
   * Migrate data from old version to new version
   */
  async migrateData(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`Migrating data from ${fromVersion} to ${toVersion}`);

    // Implement version-specific migrations
    if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
      await this.migrateV1toV1_1();
    }

    if (fromVersion === '1.1.0' && toVersion === '1.2.0') {
      await this.migrateV1_1toV1_2();
    }
  }

  /**
   * Migrate from v1.0.0 to v1.1.0
   */
  private async migrateV1toV1_1(): Promise<void> {
    // Add soil health data structure
    console.log('Migrating to v1.1.0: Adding soil health support');
  }

  /**
   * Migrate from v1.1.0 to v1.2.0
   */
  private async migrateV1_1toV1_2(): Promise<void> {
    // Add pest detection data structure
    console.log('Migrating to v1.2.0: Adding pest detection support');
  }
}

export default VersionCompatibilityService.getInstance();
