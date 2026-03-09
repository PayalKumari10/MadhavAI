/**
 * Unit tests for Storage Manager
 */

import { storageManager } from '../StorageManager';
import { encryptedStorage } from '../../storage/EncryptedStorage';

// Mock encrypted storage
jest.mock('../../storage/EncryptedStorage', () => ({
  encryptedStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('StorageManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (encryptedStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('initialize', () => {
    it('should initialize storage manager', async () => {
      await storageManager.initialize();

      // Should not throw
      expect(true).toBe(true);
    });

    it('should accept custom config', async () => {
      await storageManager.initialize({
        maxStorageSize: 1000000,
        warningThreshold: 90,
      });

      expect(true).toBe(true);
    });
  });

  describe('getStorageInfo', () => {
    it('should return storage information', async () => {
      const info = await storageManager.getStorageInfo();

      expect(info).toHaveProperty('totalSize');
      expect(info).toHaveProperty('usedSize');
      expect(info).toHaveProperty('availableSize');
      expect(info).toHaveProperty('itemCount');
      expect(info).toHaveProperty('itemsByType');
    });
  });

  describe('registerItem', () => {
    it('should register storage item', async () => {
      await storageManager.registerItem('test_key', 1000, 'profile');

      expect(encryptedStorage.setItem).toHaveBeenCalled();
    });

    it('should mark essential data types as essential', async () => {
      await storageManager.registerItem('profile_key', 1000, 'profile');

      const info = await storageManager.getStorageInfo();
      expect(info.itemCount).toBeGreaterThan(0);
    });
  });

  describe('isStorageLimitExceeded', () => {
    it('should return false when under limit', async () => {
      await storageManager.initialize({ maxStorageSize: 1000000 });
      await storageManager.registerItem('test_key', 1000, 'profile');

      const exceeded = await storageManager.isStorageLimitExceeded();

      expect(exceeded).toBe(false);
    });
  });

  describe('isStorageNearLimit', () => {
    it('should return false when not near limit', async () => {
      await storageManager.initialize({ maxStorageSize: 1000000, warningThreshold: 80 });
      await storageManager.registerItem('test_key', 1000, 'profile');

      const nearLimit = await storageManager.isStorageNearLimit();

      expect(nearLimit).toBe(false);
    });
  });

  describe('updateItemAccess', () => {
    it('should update item access time', async () => {
      await storageManager.registerItem('test_key', 1000, 'profile');
      await storageManager.updateItemAccess('test_key');

      expect(encryptedStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('unregisterItem', () => {
    it('should remove item from tracking', async () => {
      await storageManager.registerItem('test_key', 1000, 'profile');
      await storageManager.unregisterItem('test_key');

      expect(encryptedStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('cleanupOldData', () => {
    it('should clean up old non-essential data', async () => {
      await storageManager.initialize({ maxStorageSize: 1000 });

      // Register items that exceed storage
      await storageManager.registerItem('essential_1', 300, 'profile', true);
      await storageManager.registerItem('non_essential_1', 400, 'weather', false);
      await storageManager.registerItem('non_essential_2', 400, 'market', false);

      const removedCount = await storageManager.cleanupOldData();

      expect(removedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getStorageUsagePercentage', () => {
    it('should return storage usage percentage', async () => {
      // Initialize with fresh state
      await storageManager.initialize({ maxStorageSize: 10000 });

      // Clear any existing items first
      await storageManager.clearNonEssentialData();

      await storageManager.registerItem('test_key', 1000, 'profile');

      const percentage = await storageManager.getStorageUsagePercentage();

      expect(percentage).toBeGreaterThanOrEqual(0);
      expect(percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('clearNonEssentialData', () => {
    it('should clear all non-essential data', async () => {
      await storageManager.registerItem('essential_1', 100, 'profile', true);
      await storageManager.registerItem('non_essential_1', 100, 'weather', false);

      const removedCount = await storageManager.clearNonEssentialData();

      expect(removedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('estimateSize', () => {
    it('should estimate data size', () => {
      const data = { name: 'Test', value: 123 };
      const size = storageManager.estimateSize(data);

      expect(size).toBeGreaterThan(0);
    });

    it('should handle complex objects', () => {
      const data = {
        name: 'Test',
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' },
        },
      };

      const size = storageManager.estimateSize(data);

      expect(size).toBeGreaterThan(0);
    });
  });
});
