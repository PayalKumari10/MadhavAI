/**
 * Profile API Client
 * Handles profile-related API calls
 * Requirements: 1.4, 15.4
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../../config/env';
import { UserProfile, ProfileCreateData, ProfileUpdateData } from '../../types/profile.types';
import { logger } from '../../utils/logger';

class ProfileAPI {
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
   * Create a new user profile
   * POST /profile
   */
  async createProfile(profileData: ProfileCreateData): Promise<UserProfile> {
    try {
      logger.info('Creating profile via API');
      const response = await this.client.post<UserProfile>('/profile', profileData);
      logger.info('Profile created successfully via API');
      return response.data;
    } catch (error) {
      logger.error('Failed to create profile via API', error);
      throw error;
    }
  }

  /**
   * Get user profile
   * GET /profile/:userId
   */
  async getProfile(userId: string): Promise<UserProfile> {
    try {
      logger.debug(`Fetching profile for user: ${userId}`);
      const response = await this.client.get<UserProfile>(`/profile/${userId}`);
      logger.debug('Profile fetched successfully via API');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch profile via API', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * PUT /profile/:userId
   */
  async updateProfile(userId: string, updates: ProfileUpdateData): Promise<UserProfile> {
    try {
      logger.info(`Updating profile for user: ${userId}`);
      const response = await this.client.put<UserProfile>(`/profile/${userId}`, updates);
      logger.info('Profile updated successfully via API');
      return response.data;
    } catch (error) {
      logger.error('Failed to update profile via API', error);
      throw error;
    }
  }

  /**
   * Delete user profile
   * DELETE /profile/:userId
   */
  async deleteProfile(userId: string): Promise<void> {
    try {
      logger.info(`Deleting profile for user: ${userId}`);
      await this.client.delete(`/profile/${userId}`);
      logger.info('Profile deleted successfully via API');
    } catch (error) {
      logger.error('Failed to delete profile via API', error);
      throw error;
    }
  }
}

export const profileAPI = new ProfileAPI();
