/**
 * Location Service
 * Manages user location data and coordinates
 * Requirements: 1.4
 */

import { Location } from '../../types/profile.types';
import { logger } from '../../utils/logger';

class LocationService {
  /**
   * Validate location data
   * @param location - Location to validate
   * @returns Validation result
   */
  validateLocation(location: Location): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!location.state || location.state.trim().length === 0) {
      errors.push('State is required');
    }

    if (!location.district || location.district.trim().length === 0) {
      errors.push('District is required');
    }

    if (!location.village || location.village.trim().length === 0) {
      errors.push('Village is required');
    }

    if (!location.pincode || !/^\d{6}$/.test(location.pincode)) {
      errors.push('Valid 6-digit pincode is required');
    }

    if (location.coordinates) {
      const { latitude, longitude } = location.coordinates;

      // Validate latitude (-90 to 90)
      if (latitude < -90 || latitude > 90) {
        errors.push('Latitude must be between -90 and 90');
      }

      // Validate longitude (-180 to 180)
      if (longitude < -180 || longitude > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param lat1 - Latitude of first point
   * @param lon1 - Longitude of first point
   * @param lat2 - Latitude of second point
   * @param lon2 - Longitude of second point
   * @returns Distance in kilometers
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Convert degrees to radians
   * @param degrees - Angle in degrees
   * @returns Angle in radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get location from coordinates (mock implementation)
   * In production, integrate with geocoding API
   * @param latitude - Latitude
   * @param longitude - Longitude
   * @returns Location data
   */
  async getLocationFromCoordinates(
    latitude: number,
    longitude: number
  ): Promise<Partial<Location> | null> {
    try {
      // Mock implementation - In production, use Google Maps Geocoding API or similar
      logger.info(`Getting location for coordinates: ${latitude}, ${longitude}`);

      // Return mock data for now
      return {
        coordinates: {
          latitude,
          longitude,
        },
      };
    } catch (error) {
      logger.error('Failed to get location from coordinates', error);
      return null;
    }
  }

  /**
   * Format location as string
   * @param location - Location to format
   * @returns Formatted location string
   */
  formatLocation(location: Location): string {
    const parts = [location.village, location.district, location.state];
    return parts.filter((part) => part && part.trim().length > 0).join(', ');
  }
}

export const locationService = new LocationService();
