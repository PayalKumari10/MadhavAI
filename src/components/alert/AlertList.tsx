/**
 * AlertList Component
 * Displays list of alerts with priority indicators
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Alert, AlertPriority } from '../../types/alert.types';

interface AlertListProps {
  alerts: Alert[];
  onAlertPress?: (alert: Alert) => void;
  onMarkAsRead?: (alertId: string) => void;
}

export const AlertList: React.FC<AlertListProps> = ({
  alerts,
  onAlertPress,
  onMarkAsRead,
}) => {
  const getPriorityColor = (priority: AlertPriority): string => {
    switch (priority) {
      case 'critical':
        return '#DC2626'; // Red
      case 'high':
        return '#F59E0B'; // Orange
      case 'medium':
        return '#3B82F6'; // Blue
      case 'low':
        return '#10B981'; // Green
      default:
        return '#6B7280'; // Gray
    }
  };

  const getPriorityLabel = (priority: AlertPriority): string => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const alertDate = new Date(date);
    const diffMs = alertDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `In ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffMs > 0) {
      return 'Soon';
    } else {
      return 'Now';
    }
  };

  const renderAlert = ({ item }: { item: Alert }) => {
    const priorityColor = getPriorityColor(item.priority);
    const isUnread = item.status === 'scheduled' || item.status === 'sent';

    return (
      <TouchableOpacity
        style={[styles.alertCard, isUnread && styles.unreadCard]}
        onPress={() => onAlertPress?.(item)}
      >
        <View style={styles.alertHeader}>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
            <Text style={styles.priorityText}>
              {getPriorityLabel(item.priority)}
            </Text>
          </View>
          <Text style={styles.timeText}>{formatDate(item.scheduledTime)}</Text>
        </View>

        <Text style={styles.alertTitle}>{item.title}</Text>
        <Text style={styles.alertMessage} numberOfLines={2}>
          {item.message}
        </Text>

        {item.actionable && (
          <View style={styles.actionIndicator}>
            <Text style={styles.actionText}>Action Required</Text>
          </View>
        )}

        {isUnread && onMarkAsRead && (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={() => onMarkAsRead(item.id)}
          >
            <Text style={styles.markReadText}>Mark as Read</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  if (alerts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No alerts at this time</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={alerts}
      renderItem={renderAlert}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actionIndicator: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  actionText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
  },
  markReadButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  markReadText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});
