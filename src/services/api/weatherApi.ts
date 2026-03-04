/**
 * Weather API Client
 * Handles API calls for weather endpoints
 * Requirements: 6.1, 6.4, 6.7
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../../config/env';
import { WeatherForecast } from '../../types/weather.types';
import { logger } from '../../utils/logger';

interface WeatherRequest {
  latitude: number;
  longitude: number;
}

class WeatherAPI {
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
   * Get weather forecast for location
   * GET /weather/forecast
   */
  async getForecast(latitude: number, longitude: number): Promise<WeatherForecast> {
    try {
      const request: WeatherRequest = { latitude, longitude };
      const response = await this.client.get<WeatherForecast>('/weather/forecast', {
        params: request,
      });
      return response.data;
    } catch (error) {
      logger.error('Get forecast API error', error);
      throw error;
    }
  }

  /**
   * Get current weather for location
   * GET /weather/current
   */
  async getCurrentWeather(latitude: number, longitude: number): Promise<WeatherForecast['current']> {
    try {
      const request: WeatherRequest = { latitude, longitude };
      const response = await this.client.get<WeatherForecast['current']>('/weather/current', {
        params: request,
      });
      return response.data;
    } catch (error) {
      logger.error('Get current weather API error', error);
      throw error;
    }
  }

  /**
   * Get weather alerts for location
   * GET /weather/alerts
   */
  async getAlerts(latitude: number, longitude: number): Promise<WeatherForecast['alerts']> {
    try {
      const request: WeatherRequest = { latitude, longitude };
      const response = await this.client.get<WeatherForecast['alerts']>('/weather/alerts', {
        params: request,
      });
      return response.data;
    } catch (error) {
      logger.error('Get weather alerts API error', error);
      throw error;
    }
  }
}

export const weatherAPI = new WeatherAPI();
