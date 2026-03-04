/**
 * Unit tests for Sync Manager
 */

import { syncManager } from '../SyncManager';
import { syncQueue } from '../SyncQueue';
import { connectivityDetector } from '../ConnectivityDetector';

// Mock dependencies
jest.mock('../SyncQueue');
jest.mock('../ConnectivityDetector');

describe('SyncManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (syncQueue.initialize as jest.Mock).mockResolvedValue(undefined);
    (syncQueue.getPendingItems as jest.Mock).mockResolvedValue([]);
    (syncQueue.clearCompleted as jest.Mock).mockResolvedValue(0);
    (connectivityDetector.isOnline as jest.Mock).mockReturnValue(true);
    (connectivityDetector.addListener as jest.Mock).mockReturnValue(() => {});
  });

  afterEach(() => {
    syncManager.cleanup();
  });

  describe('initialize', () => {
    it('should initialize sync manager', async () => {
      await syncManager.initialize();

      expect(syncQueue.initialize).toHaveBeenCalled();
    });

    it('should accept custom config', async () => {
      await syncManager.initialize({
        maxRetries: 5,
        autoSyncEnabled: false,
      });

      expect(syncQueue.initialize).toHaveBeenCalled();
    });
  });

  describe('sync', () => {
    it('should sync pending items when online', async () => {
      const mockItems = [
        {
          id: 'sync_1',
          entityType: 'profile' as const,
          operation: 'update' as const,
          data: { name: 'Test' },
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending' as const,
        },
      ];

      (syncQueue.getPendingItems as jest.Mock).mockResolvedValue(mockItems);
      (syncQueue.updateItemStatus as jest.Mock).mockResolvedValue(undefined);

      const result = await syncManager.sync();

      expect(result.success).toBe(true);
      expect(result.syncedItems).toBe(1);
      expect(result.failedItems).toBe(0);
    });

    it('should not sync when offline', async () => {
      (connectivityDetector.isOnline as jest.Mock).mockReturnValue(false);

      const result = await syncManager.sync();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should not sync when already syncing', async () => {
      (syncQueue.getPendingItems as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      const sync1Promise = syncManager.sync();
      const sync2Promise = syncManager.sync();

      const [result1, result2] = await Promise.all([sync1Promise, sync2Promise]);

      expect(result1.success || result2.success).toBe(true);
      expect(!result1.success || !result2.success).toBe(true);
    });
  });

  describe('isSyncInProgress', () => {
    it('should return false when not syncing', () => {
      const inProgress = syncManager.isSyncInProgress();

      expect(inProgress).toBe(false);
    });
  });

  describe('getPendingSyncCount', () => {
    it('should return pending sync count', async () => {
      const mockItems = [
        {
          id: 'sync_1',
          entityType: 'profile' as const,
          operation: 'update' as const,
          data: {},
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending' as const,
        },
        {
          id: 'sync_2',
          entityType: 'profile' as const,
          operation: 'create' as const,
          data: {},
          timestamp: new Date(),
          retryCount: 0,
          status: 'pending' as const,
        },
      ];

      (syncQueue.getPendingItems as jest.Mock).mockResolvedValue(mockItems);

      const count = await syncManager.getPendingSyncCount();

      expect(count).toBe(2);
    });
  });

  describe('forceSyncNow', () => {
    it('should trigger immediate sync', async () => {
      (syncQueue.getPendingItems as jest.Mock).mockResolvedValue([]);

      const result = await syncManager.forceSyncNow();

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('syncedItems');
      expect(result).toHaveProperty('failedItems');
    });
  });

  describe('cleanup', () => {
    it('should clean up resources', () => {
      syncManager.cleanup();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});
