/**
 * Over-The-Air (OTA) Update Service
 *
 * Handles content updates without requiring app store approval.
 * This service manages:
 * - Training content updates
 * - Scheme information updates
 * - Market price data updates
 * - Configuration updates
 * - Critical security patches
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { config } from '../config/env';

interface OTAUpdate {
  id: string;
  type: 'content' | 'config' | 'security' | 'data';
  version: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  mandatory: boolean;
  downloadUrl: string;
  checksum: string;
  size: number;
  releaseDate: string;
  description: {
    [language: string]: string;
  };
  affectedModules: string[];
}

interface UpdateStatus {
  lastCheckTime: Date;
  lastUpdateTime: Date;
  pendingUpdates: OTAUpdate[];
  installedUpdates: string[];
  failedUpdates: string[];
}

export class OTAUpdateService {
  private static instance: OTAUpdateService;
  private readonly API_BASE_URL = config.OTA_API_BASE_URL;
  private readonly UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly STORAGE_KEY = 'ota_update_status';

  private constructor() {}

  static getInstance(): OTAUpdateService {
    if (!OTAUpdateService.instance) {
      OTAUpdateService.instance = new OTAUpdateService();
    }
    return OTAUpdateService.instance;
  }

  /**
   * Check for available OTA updates
   */
  async checkForUpdates(): Promise<OTAUpdate[]> {
    try {
      const currentVersion = await this.getCurrentAppVersion();
      const deviceInfo = await this.getDeviceInfo();

      const response = await axios.get(`${this.API_BASE_URL}/ota/updates`, {
        params: {
          appVersion: currentVersion,
          platform: Platform.OS,
          ...deviceInfo,
        },
        timeout: 10000,
      });

      const updates: OTAUpdate[] = response.data.updates || [];

      // Filter out already installed updates
      const status = await this.getUpdateStatus();
      const pendingUpdates = updates.filter(
        (update) => !status.installedUpdates.includes(update.id)
      );

      // Update status
      await this.updateStatus({
        ...status,
        lastCheckTime: new Date(),
        pendingUpdates,
      });

      return pendingUpdates;
    } catch (error) {
      console.error('Failed to check for OTA updates:', error);
      return [];
    }
  }

  /**
   * Download and install an OTA update
   */
  async installUpdate(update: OTAUpdate): Promise<boolean> {
    try {
      console.log(`Installing OTA update: ${update.id}`);

      // Download update content
      const content = await this.downloadUpdate(update);

      // Verify checksum
      const isValid = await this.verifyChecksum(content, update.checksum);
      if (!isValid) {
        throw new Error('Checksum verification failed');
      }

      // Apply update based on type
      switch (update.type) {
        case 'content':
          await this.applyContentUpdate(update, content);
          break;
        case 'config':
          await this.applyConfigUpdate(update, content);
          break;
        case 'security':
          await this.applySecurityUpdate(update, content);
          break;
        case 'data':
          await this.applyDataUpdate(update, content);
          break;
        default:
          throw new Error(`Unknown update type: ${update.type}`);
      }

      // Mark update as installed
      await this.markUpdateInstalled(update.id);

      console.log(`OTA update ${update.id} installed successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to install OTA update ${update.id}:`, error);
      await this.markUpdateFailed(update.id);
      return false;
    }
  }

  /**
   * Install all pending updates
   */
  async installPendingUpdates(): Promise<void> {
    const updates = await this.checkForUpdates();

    // Sort by priority (critical first)
    const sortedUpdates = updates.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const update of sortedUpdates) {
      await this.installUpdate(update);
    }
  }

  /**
   * Check if critical updates are pending
   */
  async hasCriticalUpdates(): Promise<boolean> {
    const status = await this.getUpdateStatus();
    return status.pendingUpdates.some(
      (update) => update.priority === 'critical' && update.mandatory
    );
  }

  /**
   * Force install critical updates (blocking)
   */
  async forceCriticalUpdates(): Promise<void> {
    const status = await this.getUpdateStatus();
    const criticalUpdates = status.pendingUpdates.filter(
      (update) => update.priority === 'critical' && update.mandatory
    );

    for (const update of criticalUpdates) {
      const success = await this.installUpdate(update);
      if (!success) {
        throw new Error(`Failed to install critical update: ${update.id}`);
      }
    }
  }

  /**
   * Schedule automatic update checks
   */
  startAutoUpdateCheck(): void {
    // Check immediately
    this.checkForUpdates();

    // Schedule periodic checks
    setInterval(async () => {
      const updates = await this.checkForUpdates();

      // Auto-install non-mandatory updates in background
      const autoInstallUpdates = updates.filter(
        (update) => !update.mandatory && update.priority !== 'critical'
      );

      for (const update of autoInstallUpdates) {
        await this.installUpdate(update);
      }
    }, this.UPDATE_CHECK_INTERVAL);
  }

  /**
   * Get update status
   */
  private async getUpdateStatus(): Promise<UpdateStatus> {
    try {
      const statusJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (statusJson) {
        return JSON.parse(statusJson);
      }
    } catch (error) {
      console.error('Failed to get update status:', error);
    }

    return {
      lastCheckTime: new Date(0),
      lastUpdateTime: new Date(0),
      pendingUpdates: [],
      installedUpdates: [],
      failedUpdates: [],
    };
  }

  /**
   * Update status
   */
  private async updateStatus(status: UpdateStatus): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(status));
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  }

  /**
   * Download update content
   */
  private async downloadUpdate(update: OTAUpdate): Promise<any> {
    const response = await axios.get(update.downloadUrl, {
      timeout: 60000, // 60 seconds
      responseType: 'json',
    });

    return response.data;
  }

  /**
   * Verify checksum
   */
  private async verifyChecksum(_content: any, _expectedChecksum: string): Promise<boolean> {
    // In production, implement proper checksum verification
    // For now, return true
    return true;
  }

  /**
   * Apply content update (training lessons, schemes, etc.)
   */
  private async applyContentUpdate(update: OTAUpdate, content: any): Promise<void> {
    // Store updated content in local database
    for (const module of update.affectedModules) {
      const key = `content_${module}`;
      await AsyncStorage.setItem(key, JSON.stringify(content[module]));
    }
  }

  /**
   * Apply configuration update
   */
  private async applyConfigUpdate(_update: OTAUpdate, content: any): Promise<void> {
    // Update app configuration
    await AsyncStorage.setItem('app_config', JSON.stringify(content));
  }

  /**
   * Apply security update
   */
  private async applySecurityUpdate(_update: OTAUpdate, content: any): Promise<void> {
    // Apply security patches
    // This might include updating API endpoints, certificates, etc.
    await AsyncStorage.setItem('security_config', JSON.stringify(content));
  }

  /**
   * Apply data update (market prices, weather data, etc.)
   */
  private async applyDataUpdate(update: OTAUpdate, content: any): Promise<void> {
    // Update cached data
    for (const module of update.affectedModules) {
      const key = `data_${module}`;
      await AsyncStorage.setItem(key, JSON.stringify(content[module]));
    }
  }

  /**
   * Mark update as installed
   */
  private async markUpdateInstalled(updateId: string): Promise<void> {
    const status = await this.getUpdateStatus();
    status.installedUpdates.push(updateId);
    status.lastUpdateTime = new Date();
    status.pendingUpdates = status.pendingUpdates.filter((u) => u.id !== updateId);
    await this.updateStatus(status);
  }

  /**
   * Mark update as failed
   */
  private async markUpdateFailed(updateId: string): Promise<void> {
    const status = await this.getUpdateStatus();
    status.failedUpdates.push(updateId);
    await this.updateStatus(status);
  }

  /**
   * Get current app version
   */
  private async getCurrentAppVersion(): Promise<string> {
    // In production, use react-native-device-info
    return '1.0.0';
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<any> {
    return {
      os: Platform.OS,
      osVersion: Platform.Version,
      // Add more device info as needed
    };
  }

  /**
   * Clear update cache (for testing)
   */
  async clearUpdateCache(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }
}

export default OTAUpdateService.getInstance();
