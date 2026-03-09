/**
 * Sync Queue
 * Manages queue of pending sync operations
 * Requirements: 11.4
 */

import { SyncQueueItem, SyncOperation, SyncEntityType } from '../../types/sync.types';
import { encryptedStorage } from '../storage/EncryptedStorage';
import { logger } from '../../utils/logger';

const SYNC_QUEUE_KEY = 'sync_queue';

class SyncQueue {
  private queue: SyncQueueItem[] = [];
  private isInitialized = false;

  /**
   * Initialize sync queue from storage
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const storedQueue = await encryptedStorage.getItem<SyncQueueItem[]>(SYNC_QUEUE_KEY);
      if (storedQueue && Array.isArray(storedQueue)) {
        this.queue = storedQueue;
        logger.info(`Sync queue initialized with ${this.queue.length} items`);
      } else {
        this.queue = [];
        logger.info('Sync queue initialized empty');
      }
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize sync queue', error);
      this.queue = [];
      this.isInitialized = true;
    }
  }

  /**
   * Add item to sync queue
   */
  async enqueue(
    entityType: SyncEntityType,
    operation: SyncOperation,
    data: unknown
  ): Promise<string> {
    await this.initialize();

    const item: SyncQueueItem = {
      id: this.generateId(),
      entityType,
      operation,
      data,
      timestamp: new Date(),
      retryCount: 0,
      status: 'pending',
    };

    this.queue.push(item);
    await this.persist();

    logger.info(`Item added to sync queue: ${item.id} (${entityType} ${operation})`);
    return item.id;
  }

  /**
   * Get all pending items
   */
  async getPendingItems(): Promise<SyncQueueItem[]> {
    await this.initialize();
    return this.queue.filter((item) => item.status === 'pending');
  }

  /**
   * Get all items
   */
  async getAllItems(): Promise<SyncQueueItem[]> {
    await this.initialize();
    return [...this.queue];
  }

  /**
   * Update item status
   */
  async updateItemStatus(
    itemId: string,
    status: SyncQueueItem['status'],
    error?: string
  ): Promise<void> {
    await this.initialize();

    const item = this.queue.find((i) => i.id === itemId);
    if (item) {
      item.status = status;
      if (error) {
        item.error = error;
      }
      await this.persist();
      logger.debug(`Sync queue item ${itemId} status updated to ${status}`);
    }
  }

  /**
   * Increment retry count for an item
   */
  async incrementRetryCount(itemId: string): Promise<number> {
    await this.initialize();

    const item = this.queue.find((i) => i.id === itemId);
    if (item) {
      item.retryCount += 1;
      await this.persist();
      logger.debug(`Sync queue item ${itemId} retry count: ${item.retryCount}`);
      return item.retryCount;
    }
    return 0;
  }

  /**
   * Remove item from queue
   */
  async removeItem(itemId: string): Promise<void> {
    await this.initialize();

    const initialLength = this.queue.length;
    this.queue = this.queue.filter((item) => item.id !== itemId);

    if (this.queue.length < initialLength) {
      await this.persist();
      logger.info(`Item removed from sync queue: ${itemId}`);
    }
  }

  /**
   * Clear completed items
   */
  async clearCompleted(): Promise<number> {
    await this.initialize();

    const initialLength = this.queue.length;
    this.queue = this.queue.filter((item) => item.status !== 'completed');
    const removedCount = initialLength - this.queue.length;

    if (removedCount > 0) {
      await this.persist();
      logger.info(`Cleared ${removedCount} completed items from sync queue`);
    }

    return removedCount;
  }

  /**
   * Clear all items
   */
  async clear(): Promise<void> {
    await this.initialize();
    this.queue = [];
    await this.persist();
    logger.info('Sync queue cleared');
  }

  /**
   * Get queue size
   */
  async size(): Promise<number> {
    await this.initialize();
    return this.queue.length;
  }

  /**
   * Persist queue to storage
   */
  private async persist(): Promise<void> {
    try {
      await encryptedStorage.setItem(SYNC_QUEUE_KEY, this.queue);
    } catch (error) {
      logger.error('Failed to persist sync queue', error);
      throw new Error('Failed to persist sync queue');
    }
  }

  /**
   * Generate unique ID for queue item
   */
  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const syncQueue = new SyncQueue();
