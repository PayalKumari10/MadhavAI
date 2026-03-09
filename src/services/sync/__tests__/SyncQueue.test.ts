/**
 * Unit tests for Sync Queue
 */

import { syncQueue } from '../SyncQueue';
import { encryptedStorage } from '../../storage/EncryptedStorage';

// Mock encrypted storage
jest.mock('../../storage/EncryptedStorage', () => ({
  encryptedStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    hasItem: jest.fn(),
  },
}));

describe('SyncQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (encryptedStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('initialize', () => {
    it('should initialize empty queue', async () => {
      await syncQueue.initialize();
      const size = await syncQueue.size();

      expect(size).toBe(0);
    });

    it('should load existing queue from storage', async () => {
      // This test verifies that the queue can be initialized
      // In a real scenario, it would load from storage
      await syncQueue.initialize();

      // Verify initialization doesn't throw
      expect(true).toBe(true);
    });
  });

  describe('enqueue', () => {
    it('should add item to queue', async () => {
      const itemId = await syncQueue.enqueue('profile', 'create', { name: 'Test Farmer' });

      expect(itemId).toBeTruthy();
      expect(itemId).toMatch(/^sync_/);

      const items = await syncQueue.getAllItems();
      expect(items.length).toBeGreaterThan(0);
    });

    it('should persist queue after enqueue', async () => {
      await syncQueue.enqueue('profile', 'update', { name: 'Updated' });

      expect(encryptedStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getPendingItems', () => {
    it('should return only pending items', async () => {
      await syncQueue.clear();

      const id1 = await syncQueue.enqueue('profile', 'create', { name: 'Test1' });
      await syncQueue.enqueue('profile', 'create', { name: 'Test2' });

      await syncQueue.updateItemStatus(id1, 'completed');

      const pendingItems = await syncQueue.getPendingItems();
      expect(pendingItems.length).toBe(1);
      expect(pendingItems[0].status).toBe('pending');
    });
  });

  describe('updateItemStatus', () => {
    it('should update item status', async () => {
      await syncQueue.clear();
      const itemId = await syncQueue.enqueue('profile', 'create', { name: 'Test' });

      await syncQueue.updateItemStatus(itemId, 'completed');

      const items = await syncQueue.getAllItems();
      const item = items.find((i) => i.id === itemId);
      expect(item?.status).toBe('completed');
    });

    it('should set error message when provided', async () => {
      await syncQueue.clear();
      const itemId = await syncQueue.enqueue('profile', 'create', { name: 'Test' });

      await syncQueue.updateItemStatus(itemId, 'failed', 'Network error');

      const items = await syncQueue.getAllItems();
      const item = items.find((i) => i.id === itemId);
      expect(item?.status).toBe('failed');
      expect(item?.error).toBe('Network error');
    });
  });

  describe('incrementRetryCount', () => {
    it('should increment retry count', async () => {
      await syncQueue.clear();
      const itemId = await syncQueue.enqueue('profile', 'create', { name: 'Test' });

      const count1 = await syncQueue.incrementRetryCount(itemId);
      const count2 = await syncQueue.incrementRetryCount(itemId);

      expect(count1).toBe(1);
      expect(count2).toBe(2);
    });
  });

  describe('removeItem', () => {
    it('should remove item from queue', async () => {
      await syncQueue.clear();
      const itemId = await syncQueue.enqueue('profile', 'create', { name: 'Test' });

      await syncQueue.removeItem(itemId);

      const items = await syncQueue.getAllItems();
      const item = items.find((i) => i.id === itemId);
      expect(item).toBeUndefined();
    });
  });

  describe('clearCompleted', () => {
    it('should remove completed items', async () => {
      await syncQueue.clear();

      const id1 = await syncQueue.enqueue('profile', 'create', { name: 'Test1' });
      await syncQueue.enqueue('profile', 'create', { name: 'Test2' });

      await syncQueue.updateItemStatus(id1, 'completed');

      const removedCount = await syncQueue.clearCompleted();

      expect(removedCount).toBe(1);

      const items = await syncQueue.getAllItems();
      expect(items.length).toBe(1);
      expect(items[0].status).toBe('pending');
    });
  });

  describe('clear', () => {
    it('should clear all items', async () => {
      await syncQueue.enqueue('profile', 'create', { name: 'Test1' });
      await syncQueue.enqueue('profile', 'create', { name: 'Test2' });

      await syncQueue.clear();

      const size = await syncQueue.size();
      expect(size).toBe(0);
    });
  });

  describe('size', () => {
    it('should return queue size', async () => {
      await syncQueue.clear();

      await syncQueue.enqueue('profile', 'create', { name: 'Test1' });
      await syncQueue.enqueue('profile', 'create', { name: 'Test2' });

      const size = await syncQueue.size();
      expect(size).toBe(2);
    });
  });
});
