/**
 * Unit tests for Conflict Resolver
 */

import { conflictResolver } from '../ConflictResolver';
import { ConflictData } from '../../../types/sync.types';
import { encryptedStorage } from '../../storage/EncryptedStorage';

// Mock encrypted storage
jest.mock('../../storage/EncryptedStorage', () => ({
  encryptedStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('ConflictResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (encryptedStorage.getItem as jest.Mock).mockResolvedValue([]);
  });

  describe('resolveConflict', () => {
    it('should resolve conflict with local version when local is more recent', async () => {
      const conflict: ConflictData = {
        id: 'test_1',
        entityType: 'profile',
        localVersion: {
          data: { name: 'Local Name' },
          timestamp: new Date('2024-01-02'),
        },
        remoteVersion: {
          data: { name: 'Remote Name' },
          timestamp: new Date('2024-01-01'),
        },
      };

      const resolved = await conflictResolver.resolveConflict(conflict);

      expect(resolved.resolvedVersion?.resolution).toBe('local');
      expect(resolved.resolvedVersion?.data).toEqual({ name: 'Local Name' });
    });

    it('should resolve conflict with remote version when remote is more recent', async () => {
      const conflict: ConflictData = {
        id: 'test_2',
        entityType: 'profile',
        localVersion: {
          data: { name: 'Local Name' },
          timestamp: new Date('2024-01-01'),
        },
        remoteVersion: {
          data: { name: 'Remote Name' },
          timestamp: new Date('2024-01-02'),
        },
      };

      const resolved = await conflictResolver.resolveConflict(conflict);

      expect(resolved.resolvedVersion?.resolution).toBe('remote');
      expect(resolved.resolvedVersion?.data).toEqual({ name: 'Remote Name' });
    });

    it('should prefer remote version when timestamps are equal', async () => {
      const sameTime = new Date('2024-01-01');
      const conflict: ConflictData = {
        id: 'test_3',
        entityType: 'profile',
        localVersion: {
          data: { name: 'Local Name' },
          timestamp: sameTime,
        },
        remoteVersion: {
          data: { name: 'Remote Name' },
          timestamp: sameTime,
        },
      };

      const resolved = await conflictResolver.resolveConflict(conflict);

      expect(resolved.resolvedVersion?.resolution).toBe('remote');
      expect(resolved.resolvedVersion?.data).toEqual({ name: 'Remote Name' });
    });

    it('should log conflict', async () => {
      const conflict: ConflictData = {
        id: 'test_4',
        entityType: 'profile',
        localVersion: {
          data: { name: 'Local' },
          timestamp: new Date('2024-01-01'),
        },
        remoteVersion: {
          data: { name: 'Remote' },
          timestamp: new Date('2024-01-02'),
        },
      };

      await conflictResolver.resolveConflict(conflict);

      expect(encryptedStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getConflictLog', () => {
    it('should return conflict log', async () => {
      const mockLog = [
        {
          id: 'test_1',
          entityType: 'profile' as const,
          timestamp: new Date(),
          localTimestamp: new Date('2024-01-01'),
          remoteTimestamp: new Date('2024-01-02'),
          resolution: 'remote' as const,
          reason: 'Remote version is more recent',
        },
      ];

      (encryptedStorage.getItem as jest.Mock).mockResolvedValue(mockLog);

      const log = await conflictResolver.getConflictLog();

      expect(log).toEqual(mockLog);
    });

    it('should return empty array if no log exists', async () => {
      (encryptedStorage.getItem as jest.Mock).mockResolvedValue(null);

      const log = await conflictResolver.getConflictLog();

      expect(log).toEqual([]);
    });
  });

  describe('clearConflictLog', () => {
    it('should clear conflict log', async () => {
      await conflictResolver.clearConflictLog();

      expect(encryptedStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('getConflictStats', () => {
    it('should return conflict statistics', async () => {
      const mockLog = [
        {
          id: 'test_1',
          entityType: 'profile' as const,
          timestamp: new Date(),
          localTimestamp: new Date(),
          remoteTimestamp: new Date(),
          resolution: 'local' as const,
          reason: 'Local is newer',
        },
        {
          id: 'test_2',
          entityType: 'profile' as const,
          timestamp: new Date(),
          localTimestamp: new Date(),
          remoteTimestamp: new Date(),
          resolution: 'remote' as const,
          reason: 'Remote is newer',
        },
        {
          id: 'test_3',
          entityType: 'weather' as const,
          timestamp: new Date(),
          localTimestamp: new Date(),
          remoteTimestamp: new Date(),
          resolution: 'remote' as const,
          reason: 'Remote is newer',
        },
      ];

      (encryptedStorage.getItem as jest.Mock).mockResolvedValue(mockLog);

      const stats = await conflictResolver.getConflictStats();

      expect(stats.totalConflicts).toBe(3);
      expect(stats.localWins).toBe(1);
      expect(stats.remoteWins).toBe(2);
      expect(stats.byEntityType.profile).toBe(2);
      expect(stats.byEntityType.weather).toBe(1);
    });
  });
});
