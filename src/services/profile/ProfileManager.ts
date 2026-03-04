/**
 * Profile Manager
 * Handles CRUD operations for user profiles with encrypted local storage
 * Requirements: 1.4, 1.5, 15.1
 */

import { UserProfile, ProfileCreateData, ProfileUpdateData } from '../../types/profile.types';
import { encryptedStorage } from '../storage/EncryptedStorage';
import { logger } from '../../utils/logger';

const PROFILE_STORAGE_KEY = 'user_profile';

class ProfileManager {
  /**
   * Create a new user profile
   * Property 4: Local Data Persistence
   * @param data - Profile creation data
   * @returns Created user profile
   */
  async createProfile(data: ProfileCreateData): Promise<UserProfile> {
    try {
      const now = new Date();
      const userId = `user_${data.mobileNumber}`;

      const profile: UserProfile = {
        userId,
        mobileNumber: data.mobileNumber,
        name: data.name,
        location: data.location,
        farmSize: data.farmSize,
        primaryCrops: data.primaryCrops,
        soilType: data.soilType,
        languagePreference: data.languagePreference,
        createdAt: now,
        updatedAt: now,
      };

      // Store encrypted profile locally
      await encryptedStorage.setItem(PROFILE_STORAGE_KEY, profile);

      logger.info(`Profile created for user: ${userId}`);

      return profile;
    } catch (error) {
      logger.error('Failed to create profile', error);
      throw new Error('Failed to create profile');
    }
  }

  /**
   * Get user profile from local storage
   * Property 4: Local Data Persistence - Retrieve offline
   * @returns User profile or null if not found
   */
  async getProfile(): Promise<UserProfile | null> {
    try {
      const profile = await encryptedStorage.getItem<UserProfile>(PROFILE_STORAGE_KEY);

      if (profile) {
        logger.debug('Profile retrieved from local storage');
      }

      return profile;
    } catch (error) {
      logger.error('Failed to get profile', error);
      return null;
    }
  }

  /**
   * Update user profile
   * @param updates - Profile fields to update
   * @returns Updated user profile
   */
  async updateProfile(updates: ProfileUpdateData): Promise<UserProfile | null> {
    try {
      const existingProfile = await this.getProfile();

      if (!existingProfile) {
        logger.warn('Cannot update profile - profile not found');
        return null;
      }

      const updatedProfile: UserProfile = {
        ...existingProfile,
        ...updates,
        updatedAt: new Date(),
      };

      // Store updated profile
      await encryptedStorage.setItem(PROFILE_STORAGE_KEY, updatedProfile);

      logger.info(`Profile updated for user: ${updatedProfile.userId}`);

      return updatedProfile;
    } catch (error) {
      logger.error('Failed to update profile', error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Delete user profile
   */
  async deleteProfile(): Promise<void> {
    try {
      await encryptedStorage.removeItem(PROFILE_STORAGE_KEY);
      logger.info('Profile deleted');
    } catch (error) {
      logger.error('Failed to delete profile', error);
      throw new Error('Failed to delete profile');
    }
  }

  /**
   * Check if profile exists
   * @returns true if profile exists, false otherwise
   */
  async hasProfile(): Promise<boolean> {
    try {
      return await encryptedStorage.hasItem(PROFILE_STORAGE_KEY);
    } catch (error) {
      logger.error('Failed to check if profile exists', error);
      return false;
    }
  }

  /**
   * Validate profile data
   * @param data - Profile data to validate
   * @returns Validation result with errors if any
   */
  validateProfileData(data: Partial<ProfileCreateData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (data.name && data.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }

    if (data.farmSize !== undefined && data.farmSize <= 0) {
      errors.push('Farm size must be greater than 0');
    }

    if (data.primaryCrops && data.primaryCrops.length === 0) {
      errors.push('At least one primary crop must be specified');
    }

    if (data.location) {
      if (!data.location.state || data.location.state.trim().length === 0) {
        errors.push('State is required');
      }
      if (!data.location.district || data.location.district.trim().length === 0) {
        errors.push('District is required');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const profileManager = new ProfileManager();
