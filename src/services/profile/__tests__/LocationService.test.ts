/**
 * Unit tests for Location Service
 */

import { locationService } from '../LocationService';
import { Location } from '../../../types/profile.types';

describe('LocationService', () => {
  const validLocation: Location = {
    state: 'Karnataka',
    district: 'Bangalore',
    village: 'Test Village',
    pincode: '560001',
    coordinates: {
      latitude: 12.9716,
      longitude: 77.5946,
    },
  };

  describe('validateLocation', () => {
    it('should validate correct location', () => {
      const result = locationService.validateLocation(validLocation);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing state', () => {
      const location = { ...validLocation, state: '' };
      const result = locationService.validateLocation(location);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('State is required');
    });

    it('should reject invalid pincode', () => {
      const location = { ...validLocation, pincode: '12345' };
      const result = locationService.validateLocation(location);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid 6-digit pincode is required');
    });

    it('should reject invalid latitude', () => {
      const location = {
        ...validLocation,
        coordinates: { latitude: 100, longitude: 77.5946 },
      };
      const result = locationService.validateLocation(location);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Latitude must be between -90 and 90');
    });

    it('should reject invalid longitude', () => {
      const location = {
        ...validLocation,
        coordinates: { latitude: 12.9716, longitude: 200 },
      };
      const result = locationService.validateLocation(location);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Longitude must be between -180 and 180');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // Bangalore to Mumbai (approximate)
      const distance = locationService.calculateDistance(12.9716, 77.5946, 19.076, 72.8777);

      // Distance should be approximately 840 km
      expect(distance).toBeGreaterThan(800);
      expect(distance).toBeLessThan(900);
    });

    it('should return 0 for same coordinates', () => {
      const distance = locationService.calculateDistance(12.9716, 77.5946, 12.9716, 77.5946);

      expect(distance).toBe(0);
    });
  });

  describe('formatLocation', () => {
    it('should format location as string', () => {
      const formatted = locationService.formatLocation(validLocation);

      expect(formatted).toBe('Test Village, Bangalore, Karnataka');
    });

    it('should handle missing fields', () => {
      const location = { ...validLocation, village: '' };
      const formatted = locationService.formatLocation(location);

      expect(formatted).toBe('Bangalore, Karnataka');
    });
  });
});
