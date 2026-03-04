/**
 * Unit tests for Profile Manager
 */

import { profileManager } from '../ProfileManager';
import { encryptedStorage } from '../../storage/EncryptedStorage';
import { ProfileCreateData } from '../../../types/profile.types';

// Mock encrypted storage
jest.mock('../../storage/EncryptedStorage', () => ({
  encryptedStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    hasItem: jest.fn(),
  },
}));

describe('ProfileManager', () => {
  const mockProfileData: ProfileCreateData = {
    mobileNumber: '9876543210',
    name: 'Test Farmer',
    location: {
      state: 'Karnataka',
      district: 'Bangalore',
      village: 'Test Village',
      pincode: '560001',
      coordinates: {
        latitude: 12.9716,
        longitude: 77.5946,
      },
    },
    farmSize: 5,
    primaryCrops: ['Rice', 'Wheat'],
    soilType: 'Alluvial Soil',
    languagePreference: 'en',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProfile', () => {
    it('should create a new profile', async () => {
      (encryptedStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const profile = await profileManager.createProfile(mockProfileData);

      expect(profile.userId).toBe('user_9876543210');
      expect(profile.name).toBe('Test Farmer');
      expect(profile.mobileNumber).toBe('9876543210');
      expect(profile.farmSize).toBe(5);
      expect(profile.primaryCrops).toEqual(['Rice', 'Wheat']);
      expect(encryptedStorage.setItem).toHaveBeenCalledWith(
        'user_profile',
        expect.objectContaining({
          userId: 'user_9876543210',
          name: 'Test Farmer',
        })
      );
    });

    it('should throw error if storage fails', async () => {
      (encryptedStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(profileManager.createProfile(mockProfileData)).rejects.toThrow(
        'Failed to create profile'
      );
    });
  });

  describe('getProfile', () => {
    it('should retrieve profile from storage', async () => {
      const mockProfile = {
        userId: 'user_9876543210',
        ...mockProfileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (encryptedStorage.getItem as jest.Mock).mockResolvedValue(mockProfile);

      const profile = await profileManager.getProfile();

      expect(profile).toEqual(mockProfile);
      expect(encryptedStorage.getItem).toHaveBeenCalledWith('user_profile');
    });

    it('should return null if profile not found', async () => {
      (encryptedStorage.getItem as jest.Mock).mockResolvedValue(null);

      const profile = await profileManager.getProfile();

      expect(profile).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update existing profile', async () => {
      const existingProfile = {
        userId: 'user_9876543210',
        ...mockProfileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (encryptedStorage.getItem as jest.Mock).mockResolvedValue(existingProfile);
      (encryptedStorage.setItem as jest.Mock).mockResolvedValue(undefined);

      const updates = { name: 'Updated Farmer', farmSize: 10 };
      const updatedProfile = await profileManager.updateProfile(updates);

      expect(updatedProfile?.name).toBe('Updated Farmer');
      expect(updatedProfile?.farmSize).toBe(10);
      expect(encryptedStorage.setItem).toHaveBeenCalled();
    });

    it('should return null if profile does not exist', async () => {
      (encryptedStorage.getItem as jest.Mock).mockResolvedValue(null);

      const updates = { name: 'Updated Farmer' };
      const result = await profileManager.updateProfile(updates);

      expect(result).toBeNull();
    });
  });

  describe('deleteProfile', () => {
    it('should delete profile from storage', async () => {
      (encryptedStorage.removeItem as jest.Mock).mockResolvedValue(undefined);

      await profileManager.deleteProfile();

      expect(encryptedStorage.removeItem).toHaveBeenCalledWith('user_profile');
    });
  });

  describe('hasProfile', () => {
    it('should return true if profile exists', async () => {
      (encryptedStorage.hasItem as jest.Mock).mockResolvedValue(true);

      const exists = await profileManager.hasProfile();

      expect(exists).toBe(true);
    });

    it('should return false if profile does not exist', async () => {
      (encryptedStorage.hasItem as jest.Mock).mockResolvedValue(false);

      const exists = await profileManager.hasProfile();

      expect(exists).toBe(false);
    });
  });

  describe('validateProfileData', () => {
    it('should validate correct profile data', () => {
      const result = profileManager.validateProfileData(mockProfileData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid name', () => {
      const result = profileManager.validateProfileData({ name: 'A' });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Name must be at least 2 characters long');
    });

    it('should reject invalid farm size', () => {
      const result = profileManager.validateProfileData({ farmSize: 0 });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Farm size must be greater than 0');
    });

    it('should reject empty crops array', () => {
      const result = profileManager.validateProfileData({ primaryCrops: [] });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one primary crop must be specified');
    });

    it('should reject incomplete location', () => {
      const result = profileManager.validateProfileData({
        location: {
          state: '',
          district: 'Test',
          village: 'Test',
          pincode: '123456',
          coordinates: { latitude: 0, longitude: 0 },
        },
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('State is required');
    });
  });
});
