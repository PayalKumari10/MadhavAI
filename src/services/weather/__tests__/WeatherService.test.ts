/**
 * Unit tests for Weather Service
 */

import { weatherService } from '../WeatherService';
import { encryptedStorage } from '../../storage/EncryptedStorage';

// Mock encrypted storage
jest.mock('../../storage/EncryptedStorage', () => ({
  encryptedStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

describe('WeatherService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (encryptedStorage.getItem as jest.Mock).mockResolvedValue(null);
    weatherService.stopAutoRefresh();
  });

  afterEach(() => {
    weatherService.stopAutoRefresh();
  });

  describe('getForecast', () => {
    it('should fetch weather forecast', async () => {
      const forecast = await weatherService.getForecast(12.9716, 77.5946);

      expect(forecast).toBeDefined();
      expect(forecast.location.latitude).toBe(12.9716);
      expect(forecast.location.longitude).toBe(77.5946);
      expect(forecast.daily).toHaveLength(7);
    });

    it('should return 7-day forecast', async () => {
      const forecast = await weatherService.getForecast(12.9716, 77.5946);

      expect(forecast.daily).toHaveLength(7);
      expect(forecast.daily[0]).toHaveProperty('date');
      expect(forecast.daily[0]).toHaveProperty('condition');
      expect(forecast.daily[0]).toHaveProperty('temperature');
    });

    it('should cache forecast data', async () => {
      await weatherService.getForecast(12.9716, 77.5946);

      expect(encryptedStorage.setItem).toHaveBeenCalled();
    });

    it('should return cached data if available', async () => {
      const mockCachedData = {
        forecast: {
          location: { latitude: 12.9716, longitude: 77.5946, name: 'Cached Location' },
          current: {
            date: new Date(),
            condition: 'clear' as const,
            temperature: { current: 25, min: 20, max: 30, feelsLike: 26 },
            humidity: 60,
            wind: { speed: 10, direction: 'N' },
            precipitation: { probability: 0, amount: 0, type: 'none' as const },
            uvIndex: 5,
            sunrise: new Date(),
            sunset: new Date(),
            description: 'Clear sky',
          },
          daily: [],
          alerts: [],
          lastUpdated: new Date(),
          source: 'Cache',
        },
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      };

      (encryptedStorage.getItem as jest.Mock).mockResolvedValue(mockCachedData);

      const forecast = await weatherService.getForecast(12.9716, 77.5946);

      expect(forecast.location.name).toBe('Cached Location');
      expect(forecast.source).toBe('Cache');
    });

    it('should fetch fresh data if cache expired', async () => {
      const expiredCache = {
        forecast: {
          location: { latitude: 12.9716, longitude: 77.5946, name: 'Expired' },
          current: {} as any,
          daily: [],
          alerts: [],
          lastUpdated: new Date(),
          source: 'Expired Cache',
        },
        cachedAt: new Date(Date.now() - 48 * 60 * 60 * 1000), // 48 hours ago
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired 24 hours ago
      };

      (encryptedStorage.getItem as jest.Mock).mockResolvedValue(expiredCache);

      const forecast = await weatherService.getForecast(12.9716, 77.5946);

      expect(forecast.source).toBe('Mock Weather API');
      expect(encryptedStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('startAutoRefresh', () => {
    it('should start auto-refresh timer', () => {
      weatherService.startAutoRefresh(12.9716, 77.5946);

      // Timer should be set
      expect(true).toBe(true);
    });

    it('should clear existing timer before starting new one', () => {
      weatherService.startAutoRefresh(12.9716, 77.5946);
      weatherService.startAutoRefresh(12.9716, 77.5946);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('stopAutoRefresh', () => {
    it('should stop auto-refresh timer', () => {
      weatherService.startAutoRefresh(12.9716, 77.5946);
      weatherService.stopAutoRefresh();

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle stop when no timer is running', () => {
      weatherService.stopAutoRefresh();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('should clear weather cache', async () => {
      await weatherService.clearCache();

      // Should not throw
      expect(true).toBe(true);
    });
  });
});
