import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { MarketPriceDisplay } from '../components/MarketPriceDisplay';
import { profileManager } from '../services/profile/ProfileManager';
import { logger } from '../utils/logger';

export default function MarketScreen() {
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    try {
      setLoading(true);
      const profile = await profileManager.getProfile();

      if (profile?.location?.coordinates && profile?.primaryCrops?.length > 0) {
        setMarketData({
          latitude: profile.location.coordinates.latitude,
          longitude: profile.location.coordinates.longitude,
          crops: profile.primaryCrops,
        });
      } else {
        setError('Profile or crop information not available.');
      }
    } catch (err) {
      logger.error('Failed to load market data', err);
      setError('Failed to load market data');
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
    <ScrollView style={styles.container}>
      {marketData && (
        <MarketPriceDisplay
          latitude={marketData.latitude}
          longitude={marketData.longitude}
          crops={marketData.crops}
        />
      )}
    </ScrollView>
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
