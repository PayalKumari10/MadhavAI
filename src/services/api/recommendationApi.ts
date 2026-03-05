/**
 * Recommendation API Client
 * Handles API calls for recommendation endpoints
 * Requirements: 7.1, 3.1, 4.1, 16.2
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../../config/env';
import {
  CropRecommendation,
  FertilizerRecommendation,
  SeedRecommendation,
} from '../../types/recommendation.types';
import { logger } from '../../utils/logger';

interface CropRecommendationRequest {
  userId: string;
  season?: string;
  includeExplanation?: boolean;
}

interface FertilizerRecommendationRequest {
  userId: string;
  cropName: string;
  growthStage?: string;
  includeAlternatives?: boolean;
}

interface SeedRecommendationRequest {
  userId: string;
  cropName?: string;
  season?: string;
}

class RecommendationAPI {
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
   * Get crop recommendations for a user
   * POST /recommendations/crops
   */
  async getCropRecommendations(
    userId: string,
    season?: string,
    includeExplanation: boolean = true
  ): Promise<CropRecommendation[]> {
    try {
      const request: CropRecommendationRequest = {
        userId,
        season,
        includeExplanation,
      };

      const response = await this.client.post<CropRecommendation[]>(
        '/recommendations/crops',
        request
      );

      return response.data;
    } catch (error) {
      logger.error('Get crop recommendations API error', error);
      throw error;
    }
  }

  /**
   * Get fertilizer recommendations for a crop
   * POST /recommendations/fertilizers
   */
  async getFertilizerRecommendations(
    userId: string,
    cropName: string,
    growthStage?: string,
    includeAlternatives: boolean = true
  ): Promise<FertilizerRecommendation[]> {
    try {
      const request: FertilizerRecommendationRequest = {
        userId,
        cropName,
        growthStage,
        includeAlternatives,
      };

      const response = await this.client.post<FertilizerRecommendation[]>(
        '/recommendations/fertilizers',
        request
      );

      return response.data;
    } catch (error) {
      logger.error('Get fertilizer recommendations API error', error);
      throw error;
    }
  }

  /**
   * Get seed recommendations
   * POST /recommendations/seeds
   */
  async getSeedRecommendations(
    userId: string,
    cropName?: string,
    season?: string
  ): Promise<SeedRecommendation[]> {
    try {
      const request: SeedRecommendationRequest = {
        userId,
        cropName,
        season,
      };

      const response = await this.client.post<SeedRecommendation[]>(
        '/recommendations/seeds',
        request
      );

      return response.data;
    } catch (error) {
      logger.error('Get seed recommendations API error', error);
      throw error;
    }
  }
}

export const recommendationAPI = new RecommendationAPI();
