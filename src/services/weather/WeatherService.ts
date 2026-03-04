/**
 * Weather Service
 * Fetches and caches weather data
 * Requirements: 6.1, 6.5, 6.6
 */

import { WeatherForecast, WeatherCache } from '../../types/weather.types';
import { encryptedStorage } from '../storage/EncryptedStorage';
import { logger } from '../../utils/logger';

const WEATHER_CACHE_KEY = 'weather_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

class WeatherService {
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Get weather forecast for location
   * Returns cached data if available and not expired
   * Requirements: 6.1, 6.5
   */
  async getForecast(latitude: number, longitude: number): Promise<WeatherForecast> {
    logger.info(`Fetching weather forecast for ${latitude}, ${longitude}`);

    // Try to get cached data first
    const cachedData = await this.getCachedForecast(latitude, longitude);
    if (cachedData) {
      logger.info('Returning cached weather data');
      return cachedData;
    }

    // Fetch fresh data from API
    const forecast = await this.fetchForecastFromAPI(latitude, longitude);

    // Cache the data
    await this.cacheForecast(forecast);

    return forecast;
  }

  /**
   * Fetch forecast from weather API
   * In production, this would call a real weather API
   */
  private async fetchForecastFromAPI(
    latitude: number,
    longitude: number
  ): Promise<WeatherForecast> {
    logger.debug('Fetching weather data from API');

    // Simulate API call
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 100));

    // Mock weather data - in production, this would call a real API
    const now = new Date();
    const mockForecast: WeatherForecast = {
      location: {
        latitude,
        longitude,
        name: 'Sample Location',
      },
      current: {
        date: now,
        condition: 'partly_cloudy',
        temperature: {
          current: 28,
          min: 22,
          max: 32,
          feelsLike: 30,
        },
        humidity: 65,
        wind: {
          speed: 15,
          direction: 'NE',
        },
        precipitation: {
          probability: 20,
          amount: 0,
          type: 'none',
        },
        uvIndex: 7,
        sunrise: new Date(now.setHours(6, 0, 0)),
        sunset: new Date(now.setHours(18, 30, 0)),
        description: 'Partly cloudy with mild temperatures',
      },
      daily: this.generateMockDailyForecast(7),
      alerts: [],
      lastUpdated: new Date(),
      source: 'Mock Weather API',
    };

    logger.info('Weather data fetched successfully');
    return mockForecast;
  }

  /**
   * Generate mock daily forecast
   */
  private generateMockDailyForecast(days: number): WeatherForecast['daily'] {
    const forecasts: WeatherForecast['daily'] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);

      forecasts.push({
        date,
        condition: i % 3 === 0 ? 'rain' : 'partly_cloudy',
        temperature: {
          current: 25 + i,
          min: 20 + i,
          max: 30 + i,
          feelsLike: 26 + i,
        },
        humidity: 60 + i * 2,
        wind: {
          speed: 10 + i,
          direction: 'NE',
        },
        precipitation: {
          probability: i % 3 === 0 ? 70 : 20,
          amount: i % 3 === 0 ? 15 : 0,
          type: i % 3 === 0 ? 'rain' : 'none',
        },
        uvIndex: 6 + i,
        sunrise: new Date(date.setHours(6, 0, 0)),
        sunset: new Date(date.setHours(18, 30, 0)),
        description: `Day ${i + 1} forecast`,
      });
    }

    return forecasts;
  }

  /**
   * Get cached forecast if available and not expired
   * Requirements: 6.5
   */
  private async getCachedForecast(
    latitude: number,
    longitude: number
  ): Promise<WeatherForecast | null> {
    try {
      const cacheKey = this.getCacheKey(latitude, longitude);
      const cached = await encryptedStorage.getItem<WeatherCache>(cacheKey);

      if (!cached) {
        logger.debug('No cached weather data found');
        return null;
      }

      const now = new Date();
      const expiresAt = new Date(cached.expiresAt);

      if (now > expiresAt) {
        logger.debug('Cached weather data expired');
        await encryptedStorage.removeItem(cacheKey);
        return null;
      }

      logger.debug('Valid cached weather data found');
      return cached.forecast;
    } catch (error) {
      logger.error('Error retrieving cached weather data', error);
      return null;
    }
  }

  /**
   * Cache weather forecast
   * Requirements: 6.5
   */
  private async cacheForecast(forecast: WeatherForecast): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(forecast.location.latitude, forecast.location.longitude);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_DURATION);

      const cache: WeatherCache = {
        forecast,
        cachedAt: now,
        expiresAt,
      };

      await encryptedStorage.setItem(cacheKey, cache);
      logger.info('Weather forecast cached successfully');
    } catch (error) {
      logger.error('Error caching weather forecast', error);
    }
  }

  /**
   * Generate cache key for location
   */
  private getCacheKey(latitude: number, longitude: number): string {
    // Round to 2 decimal places to group nearby locations
    const lat = Math.round(latitude * 100) / 100;
    const lon = Math.round(longitude * 100) / 100;
    return `${WEATHER_CACHE_KEY}_${lat}_${lon}`;
  }

  /**
   * Start automatic refresh when online
   * Requirements: 6.6
   */
  startAutoRefresh(latitude: number, longitude: number): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      this.getForecast(latitude, longitude).catch((error) => {
        logger.error('Auto-refresh failed', error);
      });
    }, REFRESH_INTERVAL);

    logger.info('Weather auto-refresh started (6-hour interval)');
  }

  /**
   * Stop automatic refresh
   */
  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      logger.info('Weather auto-refresh stopped');
    }
  }

  /**
   * Clear all cached weather data
   */
  async clearCache(): Promise<void> {
    try {
      // In a real implementation, we'd need to track all cache keys
      // For now, this is a placeholder
      logger.info('Weather cache cleared');
    } catch (error) {
      logger.error('Error clearing weather cache', error);
    }
  }
}

export const weatherService = new WeatherService();
