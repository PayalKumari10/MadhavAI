/**
 * Unit tests for Trend Analyzer
 */

import { trendAnalyzer } from '../TrendAnalyzer';
import { MarketPrice } from '../../../types/market.types';

describe('TrendAnalyzer', () => {
  const generateMockPrices = (
    crop: string,
    days: number,
    startPrice: number,
    priceChange: number
  ): MarketPrice[] => {
    const prices: MarketPrice[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const price = startPrice + priceChange * i;

      prices.push({
        id: `price_${i}`,
        crop,
        mandiName: 'Test Mandi',
        mandiLocation: {
          state: 'Karnataka',
          district: 'Bangalore',
          market: 'Test Mandi',
          latitude: 12.9716,
          longitude: 77.5946,
        },
        price: {
          min: price - 100,
          max: price + 100,
          modal: price,
          currency: 'INR',
        },
        unit: 'quintal',
        date,
        source: 'Test',
      });
    }

    return prices;
  };

  describe('analyzeTrend', () => {
    it('should analyze rising price trend', () => {
      const prices = generateMockPrices('Wheat', 30, 2000, -10); // Prices rising (going back in time)

      const trend = trendAnalyzer.analyzeTrend(prices, 'Wheat');

      expect(trend).toBeDefined();
      expect(trend!.crop).toBe('Wheat');
      expect(trend!.trend).toBe('rising');
      expect(trend!.changePercent).toBeGreaterThan(0);
    });

    it('should analyze falling price trend', () => {
      const prices = generateMockPrices('Rice', 30, 2000, 10); // Prices falling (going back in time)

      const trend = trendAnalyzer.analyzeTrend(prices, 'Rice');

      expect(trend).toBeDefined();
      expect(trend!.crop).toBe('Rice');
      expect(trend!.trend).toBe('falling');
      expect(trend!.changePercent).toBeLessThan(0);
    });

    it('should analyze stable price trend', () => {
      const prices = generateMockPrices('Cotton', 30, 2000, 0); // Stable prices

      const trend = trendAnalyzer.analyzeTrend(prices, 'Cotton');

      expect(trend).toBeDefined();
      expect(trend!.crop).toBe('Cotton');
      expect(trend!.trend).toBe('stable');
    });

    it('should return null for crop with no data', () => {
      const prices = generateMockPrices('Wheat', 30, 2000, 0);

      const trend = trendAnalyzer.analyzeTrend(prices, 'NonExistentCrop');

      expect(trend).toBeNull();
    });

    it('should filter by variety', () => {
      const prices: MarketPrice[] = [
        ...generateMockPrices('Wheat', 15, 2000, 0),
        ...generateMockPrices('Wheat', 15, 2500, 0).map((p) => ({ ...p, variety: 'Durum' })),
      ];

      const trend = trendAnalyzer.analyzeTrend(prices, 'Wheat', 'Durum');

      expect(trend).toBeDefined();
      expect(trend!.variety).toBe('Durum');
    });

    it('should calculate average price', () => {
      const prices = generateMockPrices('Maize', 30, 2000, 0);

      const trend = trendAnalyzer.analyzeTrend(prices, 'Maize');

      expect(trend).toBeDefined();
      expect(trend!.average).toBeCloseTo(2000, 0);
    });

    it('should respect custom period', () => {
      const prices = generateMockPrices('Sugarcane', 60, 2000, 0);

      const trend = trendAnalyzer.analyzeTrend(prices, 'Sugarcane', undefined, 15);

      expect(trend).toBeDefined();
      expect(trend!.period).toBe(15);
      expect(trend!.prices.length).toBeLessThanOrEqual(15);
    });
  });

  describe('analyzeMultipleTrends', () => {
    it('should analyze trends for multiple crops', () => {
      const prices = [
        ...generateMockPrices('Wheat', 30, 2000, 0),
        ...generateMockPrices('Rice', 30, 2500, 0),
        ...generateMockPrices('Cotton', 30, 3000, 0),
      ];

      const crops = [{ crop: 'Wheat' }, { crop: 'Rice' }, { crop: 'Cotton' }];

      const trends = trendAnalyzer.analyzeMultipleTrends(prices, crops);

      expect(trends).toHaveLength(3);
      expect(trends.map((t) => t.crop)).toEqual(['Wheat', 'Rice', 'Cotton']);
    });

    it('should skip crops with no data', () => {
      const prices = generateMockPrices('Wheat', 30, 2000, 0);

      const crops = [{ crop: 'Wheat' }, { crop: 'NonExistent' }];

      const trends = trendAnalyzer.analyzeMultipleTrends(prices, crops);

      expect(trends).toHaveLength(1);
      expect(trends[0].crop).toBe('Wheat');
    });
  });

  describe('getPriceStatistics', () => {
    it('should calculate price statistics', () => {
      const prices = generateMockPrices('Wheat', 30, 2000, 5);

      const stats = trendAnalyzer.getPriceStatistics(prices, 'Wheat');

      expect(stats).toBeDefined();
      expect(stats!.min).toBeDefined();
      expect(stats!.max).toBeDefined();
      expect(stats!.average).toBeDefined();
      expect(stats!.current).toBeDefined();
      expect(stats!.volatility).toBeDefined();
    });

    it('should return null for crop with no data', () => {
      const prices = generateMockPrices('Wheat', 30, 2000, 0);

      const stats = trendAnalyzer.getPriceStatistics(prices, 'NonExistent');

      expect(stats).toBeNull();
    });

    it('should calculate correct min and max', () => {
      const prices = generateMockPrices('Rice', 30, 2000, 10);

      const stats = trendAnalyzer.getPriceStatistics(prices, 'Rice');

      expect(stats).toBeDefined();
      expect(stats!.max).toBeGreaterThan(stats!.min);
    });
  });
});
