/**
 * Unit tests for Selling Advisor
 */

import { sellingAdvisor } from '../SellingAdvisor';
import { MarketPrice } from '../../../types/market.types';

describe('SellingAdvisor', () => {
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
        mandiName: i === 0 ? 'Best Mandi' : 'Other Mandi',
        mandiLocation: {
          state: 'Karnataka',
          district: 'Bangalore',
          market: i === 0 ? 'Best Mandi' : 'Other Mandi',
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

  describe('getRecommendation', () => {
    it('should recommend selling when price is favorable and falling', () => {
      // Current price high (2400), average will be around 2145, so ~12% advantage
      // Need higher current price for 15% threshold
      const prices = generateMockPrices('Wheat', 30, 2000, 10);
      prices[0].price.modal = 2500; // Set current price to 25% above base

      const recommendation = sellingAdvisor.getRecommendation(prices, 'Wheat');

      expect(recommendation).toBeDefined();
      expect(recommendation!.shouldSell).toBe(true);
      expect(recommendation!.timing).toBe('immediate');
      expect(recommendation!.confidence).toBe('high');
    });

    it('should recommend waiting when prices are rising', () => {
      const prices = generateMockPrices('Rice', 30, 2000, -10);

      const recommendation = sellingAdvisor.getRecommendation(prices, 'Rice');

      expect(recommendation).toBeDefined();
      expect(recommendation!.shouldSell).toBe(false);
      expect(recommendation!.timing).toBe('wait');
    });

    it('should calculate price advantage correctly', () => {
      const prices = generateMockPrices('Cotton', 30, 2000, 0);

      const recommendation = sellingAdvisor.getRecommendation(prices, 'Cotton');

      expect(recommendation).toBeDefined();
      expect(recommendation!.priceAdvantage).toBeDefined();
      expect(recommendation!.currentPrice).toBeDefined();
      expect(recommendation!.averagePrice).toBeDefined();
    });

    it('should identify best mandi', () => {
      const prices = generateMockPrices('Maize', 30, 2000, 0);

      const recommendation = sellingAdvisor.getRecommendation(prices, 'Maize');

      expect(recommendation).toBeDefined();
      expect(recommendation!.bestMandi).toBeDefined();
      expect(recommendation!.bestMandi.name).toBe('Best Mandi');
    });

    it('should return null for crop with no data', () => {
      const prices = generateMockPrices('Wheat', 30, 2000, 0);

      const recommendation = sellingAdvisor.getRecommendation(prices, 'NonExistent');

      expect(recommendation).toBeNull();
    });

    it('should provide reason for recommendation', () => {
      const prices = generateMockPrices('Sugarcane', 30, 2000, 0);

      const recommendation = sellingAdvisor.getRecommendation(prices, 'Sugarcane');

      expect(recommendation).toBeDefined();
      expect(recommendation!.reason).toBeDefined();
      expect(typeof recommendation!.reason).toBe('string');
      expect(recommendation!.reason.length).toBeGreaterThan(0);
    });
  });

  describe('detectFavorablePrices', () => {
    it('should detect prices 15% above average', () => {
      // Create prices with current price 20% above average
      const prices = generateMockPrices('Wheat', 30, 2000, 0);
      prices[0].price.modal = 2400; // 20% above average

      const alerts = sellingAdvisor.detectFavorablePrices(prices, ['Wheat']);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].isFavorable).toBe(true);
      expect(alerts[0].changePercent).toBeGreaterThanOrEqual(15);
    });

    it('should not detect prices below threshold', () => {
      const prices = generateMockPrices('Rice', 30, 2000, 0);
      prices[0].price.modal = 2100; // Only 5% above average

      const alerts = sellingAdvisor.detectFavorablePrices(prices, ['Rice']);

      expect(alerts).toHaveLength(0);
    });

    it('should detect favorable prices for multiple crops', () => {
      const prices = [
        ...generateMockPrices('Wheat', 30, 2000, 0),
        ...generateMockPrices('Rice', 30, 2000, 0),
      ];

      // Make both crops favorable
      prices[0].price.modal = 2400;
      prices[30].price.modal = 2400;

      const alerts = sellingAdvisor.detectFavorablePrices(prices, ['Wheat', 'Rice']);

      expect(alerts.length).toBeGreaterThanOrEqual(2);
    });

    it('should include recommendation in alert', () => {
      const prices = generateMockPrices('Cotton', 30, 2000, 0);
      prices[0].price.modal = 2400;

      const alerts = sellingAdvisor.detectFavorablePrices(prices, ['Cotton']);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].recommendation).toBeDefined();
      expect(alerts[0].recommendation.length).toBeGreaterThan(0);
    });
  });

  describe('detectSignificantChanges', () => {
    it('should detect price increase >15%', () => {
      const prices = generateMockPrices('Wheat', 30, 2000, -20); // Rising trend

      const alerts = sellingAdvisor.detectSignificantChanges(prices, ['Wheat']);

      expect(alerts.length).toBeGreaterThan(0);
      expect(Math.abs(alerts[0].changePercent)).toBeGreaterThanOrEqual(15);
    });

    it('should detect price decrease >15%', () => {
      const prices = generateMockPrices('Rice', 30, 2000, 20); // Falling trend

      const alerts = sellingAdvisor.detectSignificantChanges(prices, ['Rice']);

      expect(alerts.length).toBeGreaterThan(0);
      expect(Math.abs(alerts[0].changePercent)).toBeGreaterThanOrEqual(15);
    });

    it('should not detect small changes', () => {
      const prices = generateMockPrices('Cotton', 30, 2000, 2); // Small change

      const alerts = sellingAdvisor.detectSignificantChanges(prices, ['Cotton']);

      expect(alerts).toHaveLength(0);
    });

    it('should provide appropriate recommendation', () => {
      const prices = generateMockPrices('Maize', 30, 2000, -20);

      const alerts = sellingAdvisor.detectSignificantChanges(prices, ['Maize']);

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].recommendation).toBeDefined();
      expect(alerts[0].recommendation).toContain('increased');
    });
  });

  describe('getOptimalTiming', () => {
    it('should recommend immediate selling for favorable falling prices', () => {
      const prices = generateMockPrices('Wheat', 30, 2000, 10);
      prices[0].price.modal = 2500; // Set current price to 25% above base

      const timing = sellingAdvisor.getOptimalTiming(prices, 'Wheat');

      expect(timing).toBeDefined();
      expect(timing!.timing).toBe('now');
      expect(timing!.expectedPriceMovement).toBe('falling');
    });

    it('should recommend waiting for rising prices', () => {
      const prices = generateMockPrices('Rice', 30, 2000, -10);

      const timing = sellingAdvisor.getOptimalTiming(prices, 'Rice');

      expect(timing).toBeDefined();
      expect(timing!.timing).toBe('wait');
      expect(timing!.expectedPriceMovement).toBe('rising');
    });

    it('should recommend monitoring for neutral conditions', () => {
      const prices = generateMockPrices('Cotton', 30, 2000, 0);

      const timing = sellingAdvisor.getOptimalTiming(prices, 'Cotton');

      expect(timing).toBeDefined();
      expect(timing!.timing).toBe('monitor');
    });

    it('should provide reason for timing', () => {
      const prices = generateMockPrices('Maize', 30, 2000, 0);

      const timing = sellingAdvisor.getOptimalTiming(prices, 'Maize');

      expect(timing).toBeDefined();
      expect(timing!.reason).toBeDefined();
      expect(typeof timing!.reason).toBe('string');
    });

    it('should return null for crop with no data', () => {
      const prices = generateMockPrices('Wheat', 30, 2000, 0);

      const timing = sellingAdvisor.getOptimalTiming(prices, 'NonExistent');

      expect(timing).toBeNull();
    });
  });
});
