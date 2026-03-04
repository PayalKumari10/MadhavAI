/**
 * Selling Advisor
 * Provides selling recommendations based on price trends
 * Requirements: 8.2, 8.3
 */

import { logger } from '../../utils/logger';
import { MarketPrice, PriceTrend, PriceAlert } from '../../types/market.types';
import { trendAnalyzer } from './TrendAnalyzer';

interface SellingRecommendation {
  crop: string;
  variety?: string;
  shouldSell: boolean;
  reason: string;
  currentPrice: number;
  averagePrice: number;
  priceAdvantage: number; // Percentage above average
  bestMandi: {
    name: string;
    price: number;
    location: string;
  };
  timing: 'immediate' | 'wait' | 'monitor';
  confidence: 'high' | 'medium' | 'low';
}

class SellingAdvisor {
  private readonly FAVORABLE_THRESHOLD = 15; // 15% above average is favorable
  private readonly SIGNIFICANT_CHANGE_THRESHOLD = 15; // 15% change is significant

  /**
   * Get selling recommendation for a crop
   */
  getRecommendation(
    prices: MarketPrice[],
    crop: string,
    variety?: string,
    days: number = 30
  ): SellingRecommendation | null {
    logger.info(`Generating selling recommendation for ${crop}${variety ? ` (${variety})` : ''}`);

    // Get trend analysis
    const trend = trendAnalyzer.analyzeTrend(prices, crop, variety, days);
    if (!trend) {
      logger.debug(`Cannot generate recommendation: no trend data available`);
      return null;
    }

    // Get current prices for the crop
    const currentPrices = this.getCurrentPrices(prices, crop, variety);
    if (currentPrices.length === 0) {
      logger.debug(`Cannot generate recommendation: no current prices available`);
      return null;
    }

    // Find best mandi (highest price)
    const bestMandi = this.findBestMandi(currentPrices);
    const currentPrice = bestMandi.price.modal;
    const averagePrice = trend.average;
    const priceAdvantage = ((currentPrice - averagePrice) / averagePrice) * 100;

    // Determine if it's a good time to sell
    const isFavorable = priceAdvantage >= this.FAVORABLE_THRESHOLD;
    const { shouldSell, reason, timing, confidence } = this.determineSellingDecision(
      trend,
      priceAdvantage,
      isFavorable
    );

    logger.info(
      `Recommendation: ${shouldSell ? 'SELL' : 'HOLD'} - ${reason} (${priceAdvantage.toFixed(2)}% advantage)`
    );

    return {
      crop,
      variety,
      shouldSell,
      reason,
      currentPrice,
      averagePrice,
      priceAdvantage,
      bestMandi: {
        name: bestMandi.mandiName,
        price: currentPrice,
        location: `${bestMandi.mandiLocation.market}, ${bestMandi.mandiLocation.district}`,
      },
      timing,
      confidence,
    };
  }

  /**
   * Detect favorable selling opportunities (15% above average)
   */
  detectFavorablePrices(prices: MarketPrice[], crops: string[], days: number = 30): PriceAlert[] {
    logger.info(`Detecting favorable prices for ${crops.length} crops`);

    const alerts: PriceAlert[] = [];

    crops.forEach((crop) => {
      const trend = trendAnalyzer.analyzeTrend(prices, crop, undefined, days);
      if (!trend) return;

      const currentPrices = this.getCurrentPrices(prices, crop);
      if (currentPrices.length === 0) return;

      currentPrices.forEach((price) => {
        const priceAdvantage = ((price.price.modal - trend.average) / trend.average) * 100;

        if (priceAdvantage >= this.FAVORABLE_THRESHOLD) {
          alerts.push({
            id: `alert_${crop}_${price.mandiName}_${Date.now()}`,
            crop,
            variety: price.variety,
            currentPrice: price.price.modal,
            averagePrice: trend.average,
            changePercent: priceAdvantage,
            isFavorable: true,
            recommendation: `Excellent selling opportunity! Price is ${priceAdvantage.toFixed(1)}% above 30-day average at ${price.mandiName}.`,
            mandiName: price.mandiName,
            date: new Date(),
          });

          logger.info(
            `Favorable price detected: ${crop} at ${price.mandiName} (${priceAdvantage.toFixed(1)}% above average)`
          );
        }
      });
    });

    logger.info(`Generated ${alerts.length} price alerts`);
    return alerts;
  }

  /**
   * Detect significant price changes (>15%)
   */
  detectSignificantChanges(
    prices: MarketPrice[],
    crops: string[],
    days: number = 30
  ): PriceAlert[] {
    logger.info(`Detecting significant price changes for ${crops.length} crops`);

    const alerts: PriceAlert[] = [];

    crops.forEach((crop) => {
      const trend = trendAnalyzer.analyzeTrend(prices, crop, undefined, days);
      if (!trend) return;

      const absChangePercent = Math.abs(trend.changePercent);

      if (absChangePercent >= this.SIGNIFICANT_CHANGE_THRESHOLD) {
        const currentPrices = this.getCurrentPrices(prices, crop);
        if (currentPrices.length === 0) return;

        const bestMandi = this.findBestMandi(currentPrices);

        const direction = trend.changePercent > 0 ? 'increased' : 'decreased';
        const recommendation =
          trend.changePercent > 0
            ? `Price has ${direction} significantly. Consider selling soon.`
            : `Price has ${direction} significantly. Consider waiting for better prices.`;

        alerts.push({
          id: `alert_change_${crop}_${Date.now()}`,
          crop,
          currentPrice: bestMandi.price.modal,
          averagePrice: trend.average,
          changePercent: trend.changePercent,
          isFavorable: trend.changePercent > 0,
          recommendation,
          mandiName: bestMandi.mandiName,
          date: new Date(),
        });

        logger.info(
          `Significant price change detected: ${crop} ${direction} by ${absChangePercent.toFixed(1)}%`
        );
      }
    });

    logger.info(`Generated ${alerts.length} change alerts`);
    return alerts;
  }

  /**
   * Get optimal selling timing based on trends
   */
  getOptimalTiming(prices: MarketPrice[], crop: string, variety?: string): {
    timing: 'now' | 'soon' | 'wait' | 'monitor';
    reason: string;
    expectedPriceMovement: 'rising' | 'falling' | 'stable';
  } | null {
    const trend = trendAnalyzer.analyzeTrend(prices, crop, variety, 30);
    if (!trend) return null;

    const currentPrices = this.getCurrentPrices(prices, crop, variety);
    if (currentPrices.length === 0) return null;

    const bestMandi = this.findBestMandi(currentPrices);
    const priceAdvantage = ((bestMandi.price.modal - trend.average) / trend.average) * 100;

    let timing: 'now' | 'soon' | 'wait' | 'monitor';
    let reason: string;

    if (priceAdvantage >= this.FAVORABLE_THRESHOLD && trend.trend === 'falling') {
      timing = 'now';
      reason = 'Prices are favorable but falling. Sell immediately to maximize profit.';
    } else if (priceAdvantage >= this.FAVORABLE_THRESHOLD && trend.trend === 'stable') {
      timing = 'soon';
      reason = 'Prices are favorable and stable. Sell within the next few days.';
    } else if (trend.trend === 'rising') {
      timing = 'wait';
      reason = 'Prices are rising. Wait for higher prices before selling.';
    } else if (priceAdvantage < 0 && trend.trend === 'falling') {
      timing = 'wait';
      reason = 'Prices are below average and falling. Wait for market recovery.';
    } else {
      timing = 'monitor';
      reason = 'Market conditions are neutral. Monitor prices closely for opportunities.';
    }

    return {
      timing,
      reason,
      expectedPriceMovement: trend.trend,
    };
  }

  /**
   * Get current prices (most recent) for a crop
   */
  private getCurrentPrices(prices: MarketPrice[], crop: string, variety?: string): MarketPrice[] {
    let filtered = prices.filter((p) => p.crop.toLowerCase() === crop.toLowerCase());

    if (variety) {
      filtered = filtered.filter((p) => p.variety?.toLowerCase() === variety.toLowerCase());
    }

    // Get only the most recent prices (within last 3 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 3);

    return filtered.filter((p) => new Date(p.date) >= cutoffDate);
  }

  /**
   * Find mandi with best (highest) price
   */
  private findBestMandi(prices: MarketPrice[]): MarketPrice {
    return prices.reduce((best, current) =>
      current.price.modal > best.price.modal ? current : best
    );
  }

  /**
   * Determine selling decision based on trend and price advantage
   */
  private determineSellingDecision(
    trend: PriceTrend,
    priceAdvantage: number,
    isFavorable: boolean
  ): {
    shouldSell: boolean;
    reason: string;
    timing: 'immediate' | 'wait' | 'monitor';
    confidence: 'high' | 'medium' | 'low';
  } {
    // High confidence sell: Favorable price + falling trend
    if (isFavorable && trend.trend === 'falling') {
      return {
        shouldSell: true,
        reason: `Excellent selling opportunity! Price is ${priceAdvantage.toFixed(1)}% above average but trending down. Sell now to maximize profit.`,
        timing: 'immediate',
        confidence: 'high',
      };
    }

    // Medium confidence sell: Favorable price + stable trend
    if (isFavorable && trend.trend === 'stable') {
      return {
        shouldSell: true,
        reason: `Good selling opportunity. Price is ${priceAdvantage.toFixed(1)}% above average and stable. Consider selling soon.`,
        timing: 'immediate',
        confidence: 'medium',
      };
    }

    // Low confidence sell: Favorable price + rising trend
    if (isFavorable && trend.trend === 'rising') {
      return {
        shouldSell: false,
        reason: `Price is ${priceAdvantage.toFixed(1)}% above average and rising. Consider waiting for even higher prices.`,
        timing: 'monitor',
        confidence: 'low',
      };
    }

    // Rising trend: Wait
    if (trend.trend === 'rising') {
      return {
        shouldSell: false,
        reason: `Prices are trending upward. Wait for higher prices before selling.`,
        timing: 'wait',
        confidence: 'medium',
      };
    }

    // Falling trend below average: Wait for recovery
    if (trend.trend === 'falling' && priceAdvantage < 0) {
      return {
        shouldSell: false,
        reason: `Prices are below average and falling. Wait for market recovery before selling.`,
        timing: 'wait',
        confidence: 'medium',
      };
    }

    // Default: Monitor
    return {
      shouldSell: false,
      reason: `Market conditions are neutral. Monitor prices closely for better opportunities.`,
      timing: 'monitor',
      confidence: 'low',
    };
  }
}

export const sellingAdvisor = new SellingAdvisor();
