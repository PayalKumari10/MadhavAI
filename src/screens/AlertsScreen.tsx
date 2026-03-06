import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { AlertList } from '../components/alert/AlertList';
import { AlertScheduler } from '../services/alert/AlertScheduler';
import { DatabaseService } from '../services/storage/DatabaseService';
import { logger } from '../utils/logger';

export default function AlertsScreen() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const db = new DatabaseService();
      const alertScheduler = new AlertScheduler(db);
      const userAlerts = await alertScheduler.getUpcomingAlerts('demo-user-001', 7);
      setAlerts(userAlerts);
    } catch (err) {
      logger.error('Failed to load alerts', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AlertList alerts={alerts} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
  },
});
