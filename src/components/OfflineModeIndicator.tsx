/**
 * Offline Mode Indicator Component
 * Shows online/offline status and sync information
 * Requirements: 11.3
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { connectivityDetector } from '../services/sync/ConnectivityDetector';
import { syncManager } from '../services/sync/SyncManager';

interface OfflineModeIndicatorProps {
  showSyncStatus?: boolean;
  compact?: boolean;
}

export const OfflineModeIndicator: React.FC<OfflineModeIndicatorProps> = ({
  showSyncStatus = true,
  compact = false,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize connectivity status
    const status = connectivityDetector.getStatus();
    setIsOnline(status.isOnline);

    // Listen for connectivity changes
    const unsubscribe = connectivityDetector.addListener((online) => {
      setIsOnline(online);
    });

    // Update sync status periodically
    const updateSyncStatus = async () => {
      setIsSyncing(syncManager.isSyncInProgress());
      const count = await syncManager.getPendingSyncCount();
      setPendingCount(count);
    };

    updateSyncStatus();
    const interval = setInterval(updateSyncStatus, 5000); // Update every 5 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const formatLastSync = (date: Date | null): string => {
    if (!date) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
        {isSyncing && <ActivityIndicator size="small" color="#007AFF" style={styles.syncIcon} />}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, isOnline ? styles.onlineDot : styles.offlineDot]} />
        <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
      </View>

      {showSyncStatus && (
        <View style={styles.syncInfo}>
          {isSyncing ? (
            <View style={styles.syncRow}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.syncText}>Syncing...</Text>
            </View>
          ) : (
            <>
              {pendingCount > 0 && (
                <Text style={styles.pendingText}>{pendingCount} pending changes</Text>
              )}
              <Text style={styles.lastSyncText}>Last sync: {formatLastSync(lastSyncTime)}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  onlineDot: {
    backgroundColor: '#34C759',
  },
  offlineDot: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  syncInfo: {
    marginTop: 8,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 8,
  },
  pendingText: {
    fontSize: 12,
    color: '#FF9500',
    marginBottom: 4,
  },
  lastSyncText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  syncIcon: {
    marginLeft: 4,
  },
});
