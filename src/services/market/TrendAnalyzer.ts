/**
 * Trend Analyzer
 * Analyzes 30-day price trends for crops
 * Requirements: 8.2, 8.3
 */

import { logger } from '../../utils/logger';
import { MarketPrice, PriceTrend } from '../../types/market.types';

class TrendAnalyzer {
  /**
   * Analyze price trend for a crop over specified period
   */
  analyzeTrend(
    prices: MarketPrice[],
    crop: string,
    variety?: string,
    days: number = 30
  ): PriceTrend | null {
    logger.info(`Analyzing price trend for ${crop}${variety ? ` (${variety})` : ''}`);

    // Filter prices for the specific crop and variety
    let filteredPrices = prices.filter((p) => p.crop.toLowerCase() === crop.toLowerCase());

    if (variety) {
      filteredPrices = filteredPrices.filter(
        (p) => p.variety?.toLowerCase() === variety.toLowerCase()
      );
    }

    if (filteredPrices.length === 0) {
      logger.debug(`No price data found for ${crop}`);
      return null;
    }

    // Sort by date (most recent first)
    filteredPrices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Get prices for the specified period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const periodPrices = filteredPrices.filter((p) => new Date(p.date) >= cutoffDate);

    if (periodPrices.length < 2) {
      logger.debug(`Insufficient price data for trend analysis (need at least 2 data points)`);
      return null;
    }

    // Calculate trend
    const pricePoints = periodPrices.map((p) => ({
      date: new Date(p.date),
      price: p.price.modal,
    }));

    const average = this.calculateAverage(pricePoints.map((p) => p.price));
    const trend = this.determineTrend(pricePoints);
    const changePercent = this.calculateChangePercent(pricePoints);

    logger.info(`Trend analysis complete: ${trend} (${changePercent.toFixed(2)}% change)`);

    return {
      crop,
      variety,
      prices: pricePoints,
      trend,
      changePercent,
      average,
      period: days,
    };
  }

  /**
   * Analyze trends for multiple crops
   */
  analyzeMultipleTrends(
    prices: MarketPrice[],
    crops: Array<{ crop: string; variety?: string }>,
    days: number = 30
  ): PriceTrend[] {
    logger.info(`Analyzing trends for ${crops.length} crops`);

    const trends: PriceTrend[] = [];

    crops.forEach(({ crop, variety }) => {
      const trend = this.analyzeTrend(prices, crop, variety, days);
      if (trend) {
        trends.push(trend);
      }
    });

    logger.info(`Generated ${trends.length} trend analyses`);
    return trends;
  }

  /**
   * Get price statistics for a crop
   */
  getPriceStatistics(
    prices: MarketPrice[],
    crop: string,
    variety?: string,
    days: number = 30
  ): {
    min: number;
    max: number;
    average: number;
    current: number;
    volatility: number;
  } | null {
    const trend = this.analyzeTrend(prices, crop, variety, days);

    if (!trend || trend.prices.length === 0) {
      return null;
    }

    const priceValues = trend.prices.map((p) => p.price);
    const min = Math.min(...priceValues);
    const max = Math.max(...priceValues);
    const current = priceValues[0]; // Most recent price
    const volatility = this.calculateVolatility(priceValues);

    return {
      min,
      max,
      average: trend.average,
      current,
      volatility,
    };
  }

  /**
   * Calculate average price
   */
  private calculateAverage(prices: number[]): number {
    if (prices.length === 0) return 0;
    const sum = prices.reduce((acc, price) => acc + price, 0);
    return sum / prices.length;
  }

  /**
   * Determine trend direction using linear regression
   */
  private determineTrend(
    pricePoints: Array<{ date: Date; price: number }>
  ): 'rising' | 'falling' | 'stable' {
    if (pricePoints.length < 2) return 'stable';

    // Convert dates to numeric values (days since first date)
    const firstDate = pricePoints[pricePoints.length - 1].date.getTime();
    const dataPoints = pricePoints.map((p) => ({
      x: (p.date.getTime() - firstDate) / (1000 * 60 * 60 * 24), // Days
      y: p.price,
    }));

    // Calculate linear regression slope
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, p) => sum + p.x, 0);
    const sumY = dataPoints.reduce((sum, p) => sum + p.y, 0);
    const sumXY = dataPoints.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = dataPoints.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Determine trend based on slope
    // Use a threshold to avoid classifying small fluctuations as trends
    const threshold = 0.5; // Price change per day threshold

    if (slope > threshold) {
      return 'rising';
    } else if (slope < -threshold) {
      return 'falling';
    } else {
      return 'stable';
    }
  }

  /**
   * Calculate percentage change from oldest to newest price
   */
  private calculateChangePercent(pricePoints: Array<{ date: Date; price: number }>): number {
    if (pricePoints.length < 2) return 0;

    const oldestPrice = pricePoints[pricePoints.length - 1].price;
    const newestPrice = pricePoints[0].price;

    if (oldestPrice === 0) return 0;

    return ((newestPrice - oldestPrice) / oldestPrice) * 100;
  }

  /**
   * Calculate price volatility (standard deviation)
   */
  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    const average = this.calculateAverage(prices);
    const squaredDiffs = prices.map((price) => Math.pow(price - average, 2));
    const variance = this.calculateAverage(squaredDiffs);

    return Math.sqrt(variance);
  }
}

export const trendAnalyzer = new TrendAnalyzer();
