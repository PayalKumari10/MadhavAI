import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { WeatherDisplay } from '../components/WeatherDisplay';
import { profileManager } from '../services/profile/ProfileManager';
import { logger } from '../utils/logger';

export default function WeatherScreen() {
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<any>(null);

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      const profile = await profileManager.getProfile();
      
      if (profile?.location?.coordinates) {
        // Build location name from profile
        const locationParts = [];
        if (profile.location.village) locationParts.push(profile.location.village);
        if (profile.location.district) locationParts.push(profile.location.district);
        if (profile.location.state) locationParts.push(profile.location.state);
        
        const fullLocationName = locationParts.join(', ') || 'Your Location';
        
        setWeatherData({
          latitude: profile.location.coordinates.latitude,
          longitude: profile.location.coordinates.longitude,
          locationName: fullLocationName,
        });
      } else {
        // Use default location if profile doesn't have coordinates
        setWeatherData({
          latitude: 18.5204,
          longitude: 73.8567,
          locationName: 'Pune, Maharashtra',
        });
      }
    } catch (err) {
      logger.error('Failed to load weather data', err);
      // Use default location on error
      setWeatherData({
        latitude: 18.5204,
        longitude: 73.8567,
        locationName: 'Pune, Maharashtra',
      });
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

  return (
    <ScrollView style={styles.container}>
      {weatherData && (
        <WeatherDisplay
          latitude={weatherData.latitude}
          longitude={weatherData.longitude}
          locationName={weatherData.locationName}
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
