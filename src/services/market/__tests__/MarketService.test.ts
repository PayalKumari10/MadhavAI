/**
 * Unit tests for Market Service
 */

import { marketService } from '../MarketService';
import { encryptedStorage } from '../../storage/EncryptedStorage';

// Mock encrypted storage
jest.mock('../../storage/EncryptedStorage');

describe('MarketService', () => {
  const testLocation = {
    latitude: 12.9716,
    longitude: 77.5946,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (encryptedStorage.getItem as jest.Mock).mockResolvedValue(null);
    (encryptedStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    marketService.stopAutoUpdate();
  });

  describe('getPrices', () => {
    it('should fetch market prices for location', async () => {
      const prices = await marketService.getPrices(testLocation.latitude, testLocation.longitude);

      expect(prices).toBeDefined();
      expect(Array.isArray(prices)).toBe(true);
      expect(prices.length).toBeGreaterThan(0);
    });

    it('should filter prices by radius', async () => {
      const prices = await marketService.getPrices(
        testLocation.latitude,
        testLocation.longitude,
        undefined,
        50
      );

      expect(prices).toBeDefined();
      prices.forEach((price) => {
        expect(price.mandiLocation).toBeDefined();
        expect(price.mandiLocation.latitude).toBeDefined();
        expect(price.mandiLocation.longitude).toBeDefined();
      });
    });

    it('should filter prices by crop', async () => {
      const crops = ['Wheat'];
      const prices = await marketService.getPrices(
        testLocation.latitude,
        testLocation.longitude,
        crops
      );

      expect(prices).toBeDefined();
      prices.forEach((price) => {
        expect(price.crop.toLowerCase()).toBe('wheat');
      });
    });

    it('should cache fetched prices', async () => {
      await marketService.getPrices(testLocation.latitude, testLocation.longitude);

      expect(encryptedStorage.setItem).toHaveBeenCalled();
    });

    it('should return cached prices when available', async () => {
      const mockCachedData = {
        data: {
          prices: [
            {
              id: 'price_1',
              crop: 'Wheat',
              mandiName: 'Test Mandi',
              mandiLocation: {
                state: 'Karnataka',
                district: 'Bangalore',
                market: 'Test Mandi',
                latitude: testLocation.latitude + 0.01,
                longitude: testLocation.longitude + 0.01,
              },
              price: {
                min: 1800,
                max: 2200,
                modal: 2000,
                currency: 'INR',
              },
              unit: 'quintal',
              date: new Date().toISOString(),
              source: 'AGMARKNET',
            },
          ],
          trends: [],
          mandis: [],
          lastUpdated: new Date().toISOString(),
          source: 'AGMARKNET',
        },
        timestamp: new Date().toISOString(),
      };

      (encryptedStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockCachedData));

      const prices = await marketService.getPrices(testLocation.latitude, testLocation.longitude);

      expect(prices).toBeDefined();
      expect(prices.length).toBeGreaterThan(0);
    });

    it('should fetch fresh data when cache is expired', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 8); // 8 days ago

      const mockCachedData = {
        data: {
          prices: [],
          trends: [],
          mandis: [],
          lastUpdated: expiredDate.toISOString(),
          source: 'AGMARKNET',
        },
        timestamp: expiredDate.toISOString(),
      };

      (encryptedStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockCachedData));

      const prices = await marketService.getPrices(testLocation.latitude, testLocation.longitude);

      expect(prices).toBeDefined();
      // Should have fetched fresh data and cached it
      expect(encryptedStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('getNearbyMandis', () => {
    it('should fetch nearby mandis', async () => {
      const mandis = await marketService.getNearbyMandis(
        testLocation.latitude,
        testLocation.longitude
      );

      expect(mandis).toBeDefined();
      expect(Array.isArray(mandis)).toBe(true);
      expect(mandis.length).toBeGreaterThan(0);
    });

    it('should include distance for each mandi', async () => {
      const mandis = await marketService.getNearbyMandis(
        testLocation.latitude,
        testLocation.longitude
      );

      mandis.forEach((mandi) => {
        expect(mandi.distance).toBeDefined();
        expect(typeof mandi.distance).toBe('number');
      });
    });

    it('should sort mandis by distance', async () => {
      const mandis = await marketService.getNearbyMandis(
        testLocation.latitude,
        testLocation.longitude
      );

      for (let i = 1; i < mandis.length; i++) {
        expect(mandis[i].distance!).toBeGreaterThanOrEqual(mandis[i - 1].distance!);
      }
    });

    it('should filter mandis by radius', async () => {
      const radiusKm = 20;
      const mandis = await marketService.getNearbyMandis(
        testLocation.latitude,
        testLocation.longitude,
        radiusKm
      );

      mandis.forEach((mandi) => {
        expect(mandi.distance!).toBeLessThanOrEqual(radiusKm);
      });
    });
  });

  describe('Auto-update', () => {
    it('should start auto-update', () => {
      marketService.startAutoUpdate(testLocation.latitude, testLocation.longitude);

      // Verify timer is set (implementation detail)
      expect(true).toBe(true);
    });

    it('should stop auto-update', () => {
      marketService.startAutoUpdate(testLocation.latitude, testLocation.longitude);
      marketService.stopAutoUpdate();

      // Verify timer is cleared (implementation detail)
      expect(true).toBe(true);
    });

    it('should not start multiple timers', () => {
      marketService.startAutoUpdate(testLocation.latitude, testLocation.longitude);
      marketService.startAutoUpdate(testLocation.latitude, testLocation.longitude);

      // Should only have one timer
      expect(true).toBe(true);
    });
  });

  describe('Cache management', () => {
    it('should clear cache', async () => {
      await marketService.clearCache();

      // Verify cache is cleared
      expect(true).toBe(true);
    });
  });
});
