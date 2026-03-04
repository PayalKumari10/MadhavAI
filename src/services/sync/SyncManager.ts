/**
 * Sync Manager
 * Orchestrates synchronization between local and remote data
 * Requirements: 11.4
 */

import { SyncResult, SyncConfig, SyncQueueItem } from '../../types/sync.types';
import { syncQueue } from './SyncQueue';
import { connectivityDetector } from './ConnectivityDetector';
import { logger } from '../../utils/logger';

const DEFAULT_CONFIG: SyncConfig = {
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  autoSyncEnabled: true,
  syncOnStartup: true,
};

class SyncManager {
  private config: SyncConfig = DEFAULT_CONFIG;
  private isSyncing = false;
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private autoSyncUnsubscribe: (() => void) | null = null;

  /**
   * Initialize sync manager
   */
  async initialize(config?: Partial<SyncConfig>): Promise<void> {
    if (config) {
      this.config = { ...DEFAULT_CONFIG, ...config };
    }

    await syncQueue.initialize();

    // Set up auto-sync on connectivity change
    if (this.config.autoSyncEnabled) {
      this.setupAutoSync();
    }

    // Sync on startup if enabled
    if (this.config.syncOnStartup && connectivityDetector.isOnline()) {
      // Delay initial sync by 30 seconds to allow app to fully load
      setTimeout(() => {
        this.sync().catch((error) => {
          logger.error('Initial sync failed', error);
        });
      }, 30000);
    }

    logger.info('Sync manager initialized');
  }

  /**
   * Set up automatic sync on connectivity change
   */
  private setupAutoSync(): void {
    this.autoSyncUnsubscribe = connectivityDetector.addListener((isOnline) => {
      if (isOnline) {
        logger.info('Device came online, triggering auto-sync in 30 seconds');
        // Trigger sync 30 seconds after coming online
        this.scheduleSyncWithDelay(30000);
      }
    });
  }

  /**
   * Schedule sync with delay
   */
  private scheduleSyncWithDelay(delay: number): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }

    this.syncTimer = setTimeout(() => {
      this.sync().catch((error) => {
        logger.error('Scheduled sync failed', error);
      });
    }, delay);
  }

  /**
   * Perform synchronization
   */
  async sync(): Promise<SyncResult> {
    if (this.isSyncing) {
      logger.warn('Sync already in progress, skipping');
      return {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: [{ itemId: 'sync', error: 'Sync already in progress' }],
      };
    }

    if (!connectivityDetector.isOnline()) {
      logger.warn('Device is offline, cannot sync');
      return {
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: [{ itemId: 'sync', error: 'Device is offline' }],
      };
    }

    this.isSyncing = true;
    logger.info('Starting sync operation');

    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: [],
    };

    try {
      const pendingItems = await syncQueue.getPendingItems();
      logger.info(`Found ${pendingItems.length} pending items to sync`);

      for (const item of pendingItems) {
        try {
          await this.syncItem(item);
          result.syncedItems += 1;
        } catch (error) {
          result.failedItems += 1;
          result.errors.push({
            itemId: item.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          logger.error(`Failed to sync item ${item.id}`, error);
        }
      }

      // Clear completed items
      await syncQueue.clearCompleted();

      result.success = result.failedItems === 0;
      logger.info(
        `Sync completed: ${result.syncedItems} synced, ${result.failedItems} failed`
      );
    } catch (error) {
      result.success = false;
      logger.error('Sync operation failed', error);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    logger.debug(`Syncing item: ${item.id} (${item.entityType} ${item.operation})`);

    try {
      // Update status to in_progress
      await syncQueue.updateItemStatus(item.id, 'in_progress');

      // In a real implementation, this would call the appropriate API
      // For now, we'll simulate the sync
      await this.simulateSync(item);

      // Mark as completed
      await syncQueue.updateItemStatus(item.id, 'completed');
      logger.info(`Item synced successfully: ${item.id}`);
    } catch (error) {
      const retryCount = await syncQueue.incrementRetryCount(item.id);

      if (retryCount >= this.config.maxRetries) {
        // Max retries reached, mark as failed
        await syncQueue.updateItemStatus(
          item.id,
          'failed',
          error instanceof Error ? error.message : 'Unknown error'
        );
        logger.error(`Item sync failed after ${retryCount} retries: ${item.id}`);
      } else {
        // Reset to pending for retry
        await syncQueue.updateItemStatus(item.id, 'pending');
        logger.warn(`Item sync failed, will retry (${retryCount}/${this.config.maxRetries}): ${item.id}`);
      }

      throw error;
    }
  }

  /**
   * Simulate sync operation
   * In a real implementation, this would call the appropriate API
   */
  private async simulateSync(item: SyncQueueItem): Promise<void> {
    // Simulate network delay
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 100));

    // In a real implementation, this would:
    // 1. Call the appropriate API based on entityType and operation
    // 2. Handle API response
    // 3. Update local data if needed
    logger.debug(`Simulated sync for ${item.entityType} ${item.operation}`);
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Get pending sync count
   */
  async getPendingSyncCount(): Promise<number> {
    const pendingItems = await syncQueue.getPendingItems();
    return pendingItems.length;
  }

  /**
   * Force sync now
   */
  async forceSyncNow(): Promise<SyncResult> {
    logger.info('Force sync requested');
    return this.sync();
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
      this.syncTimer = null;
    }

    if (this.autoSyncUnsubscribe) {
      this.autoSyncUnsubscribe();
      this.autoSyncUnsubscribe = null;
    }

    logger.info('Sync manager cleaned up');
  }
}

export const syncManager = new SyncManager();
