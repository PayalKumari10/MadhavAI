/**
 * Conflict Resolver
 * Resolves sync conflicts using timestamp-based resolution
 * Requirements: 11.5
 */

import { ConflictData, SyncEntityType } from '../../types/sync.types';
import { encryptedStorage } from '../storage/EncryptedStorage';
import { logger } from '../../utils/logger';

const CONFLICT_LOG_KEY = 'sync_conflict_log';

interface ConflictLogEntry {
  id: string;
  entityType: SyncEntityType;
  timestamp: Date;
  localTimestamp: Date;
  remoteTimestamp: Date;
  resolution: 'local' | 'remote' | 'merged';
  reason: string;
}

class ConflictResolver {
  /**
   * Resolve conflict between local and remote versions
   * Uses timestamp-based resolution: most recent version wins
   * Requirements: 11.5
   */
  async resolveConflict(conflict: ConflictData): Promise<ConflictData> {
    logger.info(`Resolving conflict for ${conflict.entityType} ${conflict.id}`);

    const localTime = new Date(conflict.localVersion.timestamp).getTime();
    const remoteTime = new Date(conflict.remoteVersion.timestamp).getTime();

    let resolution: 'local' | 'remote' | 'merged';
    let resolvedData: unknown;
    let reason: string;

    if (localTime > remoteTime) {
      // Local version is more recent
      resolution = 'local';
      resolvedData = conflict.localVersion.data;
      reason = 'Local version is more recent';
      logger.info(`Conflict resolved: using local version (${new Date(localTime).toISOString()})`);
    } else if (remoteTime > localTime) {
      // Remote version is more recent
      resolution = 'remote';
      resolvedData = conflict.remoteVersion.data;
      reason = 'Remote version is more recent';
      logger.info(`Conflict resolved: using remote version (${new Date(remoteTime).toISOString()})`);
    } else {
      // Same timestamp, prefer remote (server is source of truth)
      resolution = 'remote';
      resolvedData = conflict.remoteVersion.data;
      reason = 'Same timestamp, preferring remote version';
      logger.info('Conflict resolved: same timestamp, using remote version');
    }

    const resolvedConflict: ConflictData = {
      ...conflict,
      resolvedVersion: {
        data: resolvedData,
        timestamp: new Date(Math.max(localTime, remoteTime)),
        resolution,
      },
    };

    // Log the conflict
    await this.logConflict({
      id: conflict.id,
      entityType: conflict.entityType,
      timestamp: new Date(),
      localTimestamp: conflict.localVersion.timestamp,
      remoteTimestamp: conflict.remoteVersion.timestamp,
      resolution,
      reason,
    });

    return resolvedConflict;
  }

  /**
   * Log conflict for audit purposes
   */
  private async logConflict(entry: ConflictLogEntry): Promise<void> {
    try {
      const existingLog = await encryptedStorage.getItem<ConflictLogEntry[]>(CONFLICT_LOG_KEY) || [];
      existingLog.push(entry);

      // Keep only last 100 conflict entries
      const trimmedLog = existingLog.slice(-100);

      await encryptedStorage.setItem(CONFLICT_LOG_KEY, trimmedLog);
      logger.debug(`Conflict logged: ${entry.id}`);
    } catch (error) {
      logger.error('Failed to log conflict', error);
    }
  }

  /**
   * Get conflict log
   */
  async getConflictLog(): Promise<ConflictLogEntry[]> {
    try {
      const log = await encryptedStorage.getItem<ConflictLogEntry[]>(CONFLICT_LOG_KEY);
      return log || [];
    } catch (error) {
      logger.error('Failed to retrieve conflict log', error);
      return [];
    }
  }

  /**
   * Clear conflict log
   */
  async clearConflictLog(): Promise<void> {
    try {
      await encryptedStorage.removeItem(CONFLICT_LOG_KEY);
      logger.info('Conflict log cleared');
    } catch (error) {
      logger.error('Failed to clear conflict log', error);
    }
  }

  /**
   * Get conflict statistics
   */
  async getConflictStats(): Promise<{
    totalConflicts: number;
    localWins: number;
    remoteWins: number;
    byEntityType: Record<string, number>;
  }> {
    const log = await this.getConflictLog();

    const stats = {
      totalConflicts: log.length,
      localWins: log.filter((entry) => entry.resolution === 'local').length,
      remoteWins: log.filter((entry) => entry.resolution === 'remote').length,
      byEntityType: {} as Record<string, number>,
    };

    log.forEach((entry) => {
      stats.byEntityType[entry.entityType] = (stats.byEntityType[entry.entityType] || 0) + 1;
    });

    return stats;
  }
}

export const conflictResolver = new ConflictResolver();
