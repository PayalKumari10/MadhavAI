/**
 * Market Price API Client
 * Handles API calls for market price endpoints
 * Requirements: 8.1, 8.4, 8.5
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../../config/env';
import { MarketPrice, PriceTrend, Mandi } from '../../types/market.types';
import { logger } from '../../utils/logger';

interface MarketPriceRequest {
  latitude: number;
  longitude: number;
  crops?: string[];
  radiusKm?: number;
}

interface TrendRequest {
  latitude: number;
  longitude: number;
  crop: string;
  variety?: string;
  days?: number;
}

class MarketAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = this.createClient();
  }

  private createClient(): AxiosInstance {
    const axiosClient = axios.create({
      baseURL: config.API_BASE_URL,
      timeout: config.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    axiosClient.interceptors.request.use(
      (requestConfig) => {
        logger.debug(`API Request: ${requestConfig.method?.toUpperCase()} ${requestConfig.url}`);
        return requestConfig;
      },
      (error) => {
        logger.error('API Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    axiosClient.interceptors.response.use(
      (response) => {
        logger.debug(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        logger.error('API Response Error', error);
        return Promise.reject(error);
      }
    );

    return axiosClient;
  }

  /**
   * Get market prices for location
   * GET /market/prices
   */
  async getPrices(
    latitude: number,
    longitude: number,
    crops?: string[],
    radiusKm: number = 50
  ): Promise<MarketPrice[]> {
    try {
      const request: MarketPriceRequest = {
        latitude,
        longitude,
        crops,
        radiusKm,
      };

      const response = await this.client.get<MarketPrice[]>('/market/prices', {
        params: request,
      });

      return response.data;
    } catch (error) {
      logger.error('Get market prices API error', error);
      throw error;
    }
  }

  /**
   * Get nearby mandis
   * GET /market/mandis
   */
  async getNearbyMandis(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<Mandi[]> {
    try {
      const response = await this.client.get<Mandi[]>('/market/mandis', {
        params: { latitude, longitude, radiusKm },
      });

      return response.data;
    } catch (error) {
      logger.error('Get nearby mandis API error', error);
      throw error;
    }
  }

  /**
   * Get price trend for a crop
   * GET /market/trend
   */
  async getPriceTrend(
    latitude: number,
    longitude: number,
    crop: string,
    variety?: string,
    days: number = 30
  ): Promise<PriceTrend> {
    try {
      const request: TrendRequest = {
        latitude,
        longitude,
        crop,
        variety,
        days,
      };

      const response = await this.client.get<PriceTrend>('/market/trend', {
        params: request,
      });

      return response.data;
    } catch (error) {
      logger.error('Get price trend API error', error);
      throw error;
    }
  }

  /**
   * Get selling recommendation for a crop
   * GET /market/recommendation
   */
  async getSellingRecommendation(
    latitude: number,
    longitude: number,
    crop: string,
    variety?: string
  ): Promise<{
    shouldSell: boolean;
    reason: string;
    currentPrice: number;
    averagePrice: number;
    priceAdvantage: number;
    bestMandi: {
      name: string;
      price: number;
      location: string;
    };
    timing: string;
    confidence: string;
  }> {
    try {
      const response = await this.client.get('/market/recommendation', {
        params: { latitude, longitude, crop, variety },
      });

      return response.data;
    } catch (error) {
      logger.error('Get selling recommendation API error', error);
      throw error;
    }
  }
}

export const marketAPI = new MarketAPI();
