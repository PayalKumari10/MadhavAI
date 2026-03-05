/**
 * Data Aggregator Service
 * Collects data from all sources for recommendation generation
 * Requirements: 16.1
 */

import { FarmingContext, Season } from '../../types/recommendation.types';
import { UserProfile } from '../../types/profile.types';
import { SoilHealthData } from '../../types/soil.types';
import { WeatherForecast } from '../../types/weather.types';
import { MarketData } from '../../types/market.types';
import { profileAPI } from '../api/profileApi';
import { soilApi } from '../api/soilApi';
import { weatherAPI } from '../api/weatherApi';
import { marketAPI } from '../api/marketApi';

/**
 * Data aggregator for collecting all required data sources
 */
export class DataAggregator {
  /**
   * Aggregate all data sources for a user
   */
  async aggregateData(userId: string): Promise<FarmingContext> {
    try {
      // Fetch all data in parallel
      const [userProfile, soilRecords, weatherForecast, marketData] = await Promise.all([
        this.getUserProfile(userId),
        this.getSoilData(userId),
        this.getWeatherData(userId),
        this.getMarketData(userId),
      ]);

      // Get current season
      const currentSeason = this.getCurrentSeason();

      return {
        userProfile,
        soilData: soilRecords.length > 0 ? soilRecords[0] : null,
        weatherForecast,
        marketData,
        currentSeason,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to aggregate data: ${error}`);
    }
  }

  /**
   * Get user profile
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      return await profileAPI.getProfile(userId);
    } catch (error) {
      throw new Error(`Failed to fetch user profile: ${error}`);
    }
  }

  /**
   * Get soil health data
   */
  private async getSoilData(userId: string): Promise<SoilHealthData[]> {
    try {
      return await soilApi.getSoilHealthByUser(userId);
    } catch (error) {
      // Soil data is optional, return empty array if not available
      return [];
    }
  }

  /**
   * Get weather forecast
   */
  private async getWeatherData(userId: string): Promise<WeatherForecast | null> {
    try {
      const profile = await profileAPI.getProfile(userId);
      if (!profile.location) {
        return null;
      }
      return await weatherAPI.getForecast(
        profile.location.coordinates.latitude,
        profile.location.coordinates.longitude
      );
    } catch (error) {
      // Weather data is optional
      return null;
    }
  }

  /**
   * Get market data
   */
  private async getMarketData(userId: string): Promise<MarketData | null> {
    try {
      const profile = await profileAPI.getProfile(userId);
      if (!profile.location || !profile.primaryCrops || profile.primaryCrops.length === 0) {
        return null;
      }
      
      // Get market data for the first crop
      const cropName = profile.primaryCrops[0];
      const [prices, mandis, trend] = await Promise.all([
        marketAPI.getPrices(
          profile.location.coordinates.latitude,
          profile.location.coordinates.longitude,
          [cropName]
        ),
        marketAPI.getNearbyMandis(
          profile.location.coordinates.latitude,
          profile.location.coordinates.longitude
        ),
        marketAPI.getPriceTrend(
          profile.location.coordinates.latitude,
          profile.location.coordinates.longitude,
          cropName
        ),
      ]);

      return {
        prices,
        trends: [trend],
        mandis,
        lastUpdated: new Date(),
        source: 'Government Market API',
      };
    } catch (error) {
      // Market data is optional
      return null;
    }
  }

  /**
   * Determine current season based on month
   */
  private getCurrentSeason(): Season {
    const month = new Date().getMonth() + 1; // 1-12

    // Kharif: June to October (monsoon season)
    if (month >= 6 && month <= 10) {
      return 'kharif';
    }
    // Rabi: November to March (winter season)
    else if (month >= 11 || month <= 3) {
      return 'rabi';
    }
    // Zaid: April to May (summer season)
    else {
      return 'zaid';
    }
  }

  /**
   * Validate farming context completeness
   */
  validateContext(context: FarmingContext): {
    isValid: boolean;
    missingData: string[];
  } {
    const missingData: string[] = [];

    if (!context.userProfile) {
      missingData.push('User profile');
    }

    if (!context.userProfile.location) {
      missingData.push('User location');
    }

    if (!context.userProfile.farmSize || !context.userProfile.primaryCrops) {
      missingData.push('Farm data');
    }

    if (!context.soilData) {
      missingData.push('Soil health data');
    }

    if (!context.weatherForecast) {
      missingData.push('Weather forecast');
    }

    if (!context.marketData) {
      missingData.push('Market data');
    }

    return {
      isValid: missingData.length === 0,
      missingData,
    };
  }
}

// Export singleton instance
export const dataAggregator = new DataAggregator();
