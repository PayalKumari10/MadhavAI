/**
 * Weather Display Component
 * Shows 7-day weather forecast with farming advice
 * Requirements: 6.1, 6.4
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { weatherService } from '../services/weather/WeatherService';
import { weatherAdvisor } from '../services/weather/WeatherAdvisor';
import { WeatherForecast } from '../types/weather.types';
import { logger } from '../utils/logger';

interface WeatherDisplayProps {
  latitude: number;
  longitude: number;
  showAdvice?: boolean;
}

export const WeatherDisplay: React.FC<WeatherDisplayProps> = ({
  latitude,
  longitude,
  showAdvice = true,
}) => {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWeather();
  }, [latitude, longitude]);

  const loadWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await weatherService.getForecast(latitude, longitude);
      setForecast(data);
      logger.info('Weather data loaded successfully');
    } catch (err) {
      setError('Failed to load weather data');
      logger.error('Error loading weather', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition: string): string => {
    const icons: Record<string, string> = {
      clear: '☀️',
      partly_cloudy: '⛅',
      cloudy: '☁️',
      rain: '🌧️',
      heavy_rain: '⛈️',
      thunderstorm: '⚡',
      drizzle: '🌦️',
      fog: '🌫️',
      snow: '❄️',
      hail: '🌨️',
    };
    return icons[condition] || '🌤️';
  };

  const formatDate = (date: Date): string => {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading weather...</Text>
      </View>
    );
  }

  if (error || !forecast) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'No weather data available'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Current Weather */}
      <View style={styles.currentWeather}>
        <Text style={styles.locationText}>{forecast.location.name}</Text>
        <View style={styles.currentRow}>
          <Text style={styles.weatherIcon}>{getWeatherIcon(forecast.current.condition)}</Text>
          <View>
            <Text style={styles.temperature}>{Math.round(forecast.current.temperature.current)}°C</Text>
            <Text style={styles.condition}>{forecast.current.description}</Text>
          </View>
        </View>
        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>
            H: {Math.round(forecast.current.temperature.max)}° L: {Math.round(forecast.current.temperature.min)}°
          </Text>
          <Text style={styles.detailText}>Humidity: {forecast.current.humidity}%</Text>
          <Text style={styles.detailText}>Wind: {forecast.current.wind.speed} km/h</Text>
        </View>
      </View>

      {/* Farming Advice for Current Weather */}
      {showAdvice && (
        <View style={styles.adviceContainer}>
          <Text style={styles.adviceTitle}>Farming Advice</Text>
          {weatherAdvisor.getAdviceForForecast(forecast.current).advice.map((advice, index) => (
            <Text key={index} style={styles.adviceText}>
              • {advice}
            </Text>
          ))}
        </View>
      )}

      {/* 7-Day Forecast */}
      <View style={styles.forecastContainer}>
        <Text style={styles.sectionTitle}>7-Day Forecast</Text>
        {forecast.daily.map((day, index) => {
          const advice = weatherAdvisor.getAdviceForForecast(day);
          return (
            <View key={index} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
                <Text style={styles.dayIcon}>{getWeatherIcon(day.condition)}</Text>
                <Text style={styles.dayTemp}>
                  {Math.round(day.temperature.max)}° / {Math.round(day.temperature.min)}°
                </Text>
              </View>
              <Text style={styles.dayDescription}>{day.description}</Text>
              {showAdvice && advice.priority !== 'low' && (
                <View style={styles.dayAdvice}>
                  <Text style={styles.dayAdviceText}>⚠️ {advice.advice[0]}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Alerts */}
      {forecast.alerts.length > 0 && (
        <View style={styles.alertsContainer}>
          <Text style={styles.sectionTitle}>Weather Alerts</Text>
          {forecast.alerts.map((alert) => (
            <View key={alert.id} style={[styles.alertCard, styles[`alert_${alert.severity}`]]}>
              <Text style={styles.alertTitle}>{alert.title}</Text>
              <Text style={styles.alertDescription}>{alert.description}</Text>
              <Text style={styles.alertAdvice}>💡 {alert.farmingAdvice}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.lastUpdated}>
        Last updated: {new Date(forecast.lastUpdated).toLocaleString()}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  currentWeather: {
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    margin: 16,
  },
  locationText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
    marginBottom: 10,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  weatherIcon: {
    fontSize: 60,
    marginRight: 20,
  },
  temperature: {
    fontSize: 48,
    color: '#FFF',
    fontWeight: 'bold',
  },
  condition: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  adviceContainer: {
    backgroundColor: '#FFF',
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
  },
  adviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  adviceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  forecastContainer: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  dayCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  dayIcon: {
    fontSize: 32,
    marginHorizontal: 10,
  },
  dayTemp: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dayDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dayAdvice: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  dayAdviceText: {
    fontSize: 13,
    color: '#856404',
  },
  alertsContainer: {
    margin: 16,
    marginTop: 0,
  },
  alertCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  alert_low: {
    backgroundColor: '#E3F2FD',
  },
  alert_medium: {
    backgroundColor: '#FFF3CD',
  },
  alert_high: {
    backgroundColor: '#FFE5E5',
  },
  alert_severe: {
    backgroundColor: '#FFCDD2',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  alertDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  alertAdvice: {
    fontSize: 13,
    color: '#333',
    fontStyle: 'italic',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
});
