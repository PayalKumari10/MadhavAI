/**
 * Sync-related type definitions
 * Requirements: 11.4
 */

export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export type SyncOperation = 'create' | 'update' | 'delete';

export type SyncEntityType = 'profile' | 'scheme' | 'weather' | 'market' | 'soil' | 'training' | 'alert';

export interface SyncQueueItem {
  id: string;
  entityType: SyncEntityType;
  operation: SyncOperation;
  data: unknown;
  timestamp: Date;
  retryCount: number;
  status: SyncStatus;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: Array<{ itemId: string; error: string }>;
}

export interface ConnectivityStatus {
  isOnline: boolean;
  lastChecked: Date;
}

export interface SyncConfig {
  maxRetries: number;
  retryDelay: number; // milliseconds
  autoSyncEnabled: boolean;
  syncOnStartup: boolean;
}

export interface ConflictData {
  id: string;
  entityType: SyncEntityType;
  localVersion: {
    data: unknown;
    timestamp: Date;
  };
  remoteVersion: {
    data: unknown;
    timestamp: Date;
  };
  resolvedVersion?: {
    data: unknown;
    timestamp: Date;
    resolution: 'local' | 'remote' | 'merged';
  };
}

export interface StorageInfo {
  totalSize: number; // bytes
  usedSize: number; // bytes
  availableSize: number; // bytes
  itemCount: number;
  itemsByType: Record<string, number>;
}

export interface StorageConfig {
  maxStorageSize: number; // bytes (500 MB = 524288000 bytes)
  warningThreshold: number; // percentage (e.g., 80)
  essentialDataTypes: SyncEntityType[];
}
