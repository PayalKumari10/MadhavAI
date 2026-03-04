/**
 * Storage Manager
 * Manages local storage with 500 MB limit enforcement
 * Requirements: 11.6, 11.7, 11.8
 */

import { StorageInfo, StorageConfig, SyncEntityType } from '../../types/sync.types';
import { encryptedStorage } from '../storage/EncryptedStorage';
import { logger } from '../../utils/logger';

const STORAGE_INFO_KEY = 'storage_info';
const MAX_STORAGE_SIZE = 524288000; // 500 MB in bytes
const WARNING_THRESHOLD = 80; // 80%

const DEFAULT_CONFIG: StorageConfig = {
  maxStorageSize: MAX_STORAGE_SIZE,
  warningThreshold: WARNING_THRESHOLD,
  essentialDataTypes: ['profile', 'alert', 'scheme'], // Essential data that should be prioritized
};

interface StorageItem {
  key: string;
  size: number;
  type: SyncEntityType | 'other';
  lastAccessed: Date;
  isEssential: boolean;
}

class StorageManager {
  private config: StorageConfig = DEFAULT_CONFIG;
  private storageItems: Map<string, StorageItem> = new Map();

  /**
   * Initialize storage manager
   */
  async initialize(config?: Partial<StorageConfig>): Promise<void> {
    if (config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
    }

    await this.updateStorageInfo();
    logger.info('Storage manager initialized');
  }

  /**
   * Get current storage information
   */
  async getStorageInfo(): Promise<StorageInfo> {
    await this.updateStorageInfo();

    const usedSize = Array.from(this.storageItems.values()).reduce(
      (total, item) => total + item.size,
      0
    );

    const itemsByType: Record<string, number> = {};
    this.storageItems.forEach((item) => {
      itemsByType[item.type] = (itemsByType[item.type] || 0) + 1;
    });

    return {
      totalSize: this.config.maxStorageSize,
      usedSize,
      availableSize: this.config.maxStorageSize - usedSize,
      itemCount: this.storageItems.size,
      itemsByType,
    };
  }

  /**
   * Check if storage limit is exceeded
   */
  async isStorageLimitExceeded(): Promise<boolean> {
    const info = await this.getStorageInfo();
    return info.usedSize >= this.config.maxStorageSize;
  }

  /**
   * Check if storage is near limit (warning threshold)
   */
  async isStorageNearLimit(): Promise<boolean> {
    const info = await this.getStorageInfo();
    const usagePercentage = (info.usedSize / info.totalSize) * 100;
    return usagePercentage >= this.config.warningThreshold;
  }

  /**
   * Register a storage item
   */
  async registerItem(
    key: string,
    size: number,
    type: SyncEntityType | 'other',
    isEssential?: boolean
  ): Promise<void> {
    const item: StorageItem = {
      key,
      size,
      type,
      lastAccessed: new Date(),
      isEssential: isEssential ?? this.config.essentialDataTypes.includes(type as SyncEntityType),
    };

    this.storageItems.set(key, item);
    await this.persistStorageInfo();

    // Check if we need to free up space
    if (await this.isStorageLimitExceeded()) {
      logger.warn('Storage limit exceeded, cleaning up old data');
      await this.cleanupOldData();
    }
  }

  /**
   * Update item access time
   */
  async updateItemAccess(key: string): Promise<void> {
    const item = this.storageItems.get(key);
    if (item) {
      item.lastAccessed = new Date();
      await this.persistStorageInfo();
    }
  }

  /**
   * Remove item from tracking
   */
  async unregisterItem(key: string): Promise<void> {
    this.storageItems.delete(key);
    await this.persistStorageInfo();
  }

  /**
   * Clean up old cached data to free space
   * Prioritizes essential data and removes oldest non-essential items
   * Requirements: 11.7, 11.8
   */
  async cleanupOldData(): Promise<number> {
    logger.info('Starting storage cleanup');

    const info = await this.getStorageInfo();
    const targetSize = this.config.maxStorageSize * 0.7; // Clean up to 70% capacity
    const sizeToFree = info.usedSize - targetSize;

    if (sizeToFree <= 0) {
      logger.info('No cleanup needed');
      return 0;
    }

    // Get non-essential items sorted by last access time (oldest first)
    const nonEssentialItems = Array.from(this.storageItems.values())
      .filter((item) => !item.isEssential)
      .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    let freedSize = 0;
    let removedCount = 0;

    for (const item of nonEssentialItems) {
      if (freedSize >= sizeToFree) {
        break;
      }

      try {
        await encryptedStorage.removeItem(item.key);
        freedSize += item.size;
        removedCount += 1;
        this.storageItems.delete(item.key);
        logger.debug(`Removed cached item: ${item.key} (${item.size} bytes)`);
      } catch (error) {
        logger.error(`Failed to remove item ${item.key}`, error);
      }
    }

    await this.persistStorageInfo();

    logger.info(
      `Storage cleanup completed: removed ${removedCount} items, freed ${freedSize} bytes`
    );

    return removedCount;
  }

  /**
   * Get storage usage percentage
   */
  async getStorageUsagePercentage(): Promise<number> {
    const info = await this.getStorageInfo();
    return (info.usedSize / info.totalSize) * 100;
  }

  /**
   * Clear all non-essential data
   */
  async clearNonEssentialData(): Promise<number> {
    logger.info('Clearing all non-essential data');

    const nonEssentialItems = Array.from(this.storageItems.values()).filter(
      (item) => !item.isEssential
    );

    let removedCount = 0;

    for (const item of nonEssentialItems) {
      try {
        await encryptedStorage.removeItem(item.key);
        this.storageItems.delete(item.key);
        removedCount += 1;
      } catch (error) {
        logger.error(`Failed to remove item ${item.key}`, error);
      }
    }

    await this.persistStorageInfo();

    logger.info(`Cleared ${removedCount} non-essential items`);
    return removedCount;
  }

  /**
   * Update storage info from actual storage
   */
  private async updateStorageInfo(): Promise<void> {
    try {
      const storedInfo = await encryptedStorage.getItem<Map<string, StorageItem>>(
        STORAGE_INFO_KEY
      );

      if (storedInfo) {
        // Convert plain object back to Map
        this.storageItems = new Map(Object.entries(storedInfo));
      }
    } catch (error) {
      logger.error('Failed to update storage info', error);
    }
  }

  /**
   * Persist storage info
   */
  private async persistStorageInfo(): Promise<void> {
    try {
      // Convert Map to plain object for storage
      const storageObj = Object.fromEntries(this.storageItems);
      await encryptedStorage.setItem(STORAGE_INFO_KEY, storageObj);
    } catch (error) {
      logger.error('Failed to persist storage info', error);
    }
  }

  /**
   * Estimate size of data in bytes
   */
  estimateSize(data: unknown): number {
    try {
      const jsonString = JSON.stringify(data);
      // Rough estimate: 2 bytes per character for UTF-16
      return jsonString.length * 2;
    } catch (error) {
      logger.error('Failed to estimate data size', error);
      return 0;
    }
  }
}

export const storageManager = new StorageManager();
