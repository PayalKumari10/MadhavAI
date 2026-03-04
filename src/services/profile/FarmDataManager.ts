/**
 * Farm Data Manager
 * Manages farm-specific data (size, crops, soil type)
 * Requirements: 1.4
 */

import { FarmData } from '../../types/profile.types';

class FarmDataManager {
  /**
   * Validate farm data
   * @param farmData - Farm data to validate
   * @returns Validation result
   */
  validateFarmData(farmData: FarmData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate farm size
    if (farmData.farmSize <= 0) {
      errors.push('Farm size must be greater than 0');
    }

    if (farmData.farmSize > 10000) {
      errors.push('Farm size seems unusually large. Please verify.');
    }

    // Validate primary crops
    if (!farmData.primaryCrops || farmData.primaryCrops.length === 0) {
      errors.push('At least one primary crop must be specified');
    }

    // Validate soil type
    if (!farmData.soilType || farmData.soilType.trim().length === 0) {
      errors.push('Soil type is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get common crop types in India
   * @returns List of common crops
   */
  getCommonCrops(): string[] {
    return [
      'Rice',
      'Wheat',
      'Maize',
      'Sugarcane',
      'Cotton',
      'Pulses',
      'Groundnut',
      'Soybean',
      'Sunflower',
      'Mustard',
      'Potato',
      'Onion',
      'Tomato',
      'Chili',
      'Turmeric',
      'Ginger',
      'Tea',
      'Coffee',
      'Rubber',
      'Coconut',
      'Banana',
      'Mango',
      'Orange',
      'Grapes',
    ];
  }

  /**
   * Get common soil types in India
   * @returns List of common soil types
   */
  getCommonSoilTypes(): string[] {
    return [
      'Alluvial Soil',
      'Black Soil (Regur)',
      'Red Soil',
      'Laterite Soil',
      'Desert Soil',
      'Mountain Soil',
      'Saline Soil',
      'Peaty Soil',
      'Forest Soil',
      'Clay Soil',
      'Sandy Soil',
      'Loamy Soil',
    ];
  }

  /**
   * Get irrigation types
   * @returns List of irrigation types
   */
  getIrrigationTypes(): string[] {
    return [
      'Drip Irrigation',
      'Sprinkler Irrigation',
      'Surface Irrigation',
      'Flood Irrigation',
      'Furrow Irrigation',
      'Rain-fed',
      'Well Irrigation',
      'Canal Irrigation',
      'Tank Irrigation',
    ];
  }

  /**
   * Get water sources
   * @returns List of water sources
   */
  getWaterSources(): string[] {
    return [
      'Borewell',
      'Open Well',
      'Canal',
      'River',
      'Pond',
      'Tank',
      'Rainwater Harvesting',
      'Government Supply',
    ];
  }

  /**
   * Calculate farm category based on size
   * @param farmSize - Farm size in acres
   * @returns Farm category
   */
  getFarmCategory(farmSize: number): string {
    if (farmSize < 2.5) {
      return 'Marginal Farmer';
    } else if (farmSize < 5) {
      return 'Small Farmer';
    } else if (farmSize < 10) {
      return 'Semi-Medium Farmer';
    } else if (farmSize < 25) {
      return 'Medium Farmer';
    } else {
      return 'Large Farmer';
    }
  }

  /**
   * Get recommended crops for soil type
   * @param soilType - Soil type
   * @returns List of recommended crops
   */
  getRecommendedCropsForSoil(soilType: string): string[] {
    const recommendations: Record<string, string[]> = {
      'Alluvial Soil': ['Rice', 'Wheat', 'Sugarcane', 'Cotton', 'Pulses'],
      'Black Soil (Regur)': ['Cotton', 'Wheat', 'Jowar', 'Linseed', 'Sunflower'],
      'Red Soil': ['Groundnut', 'Pulses', 'Millets', 'Tobacco', 'Cotton'],
      'Laterite Soil': ['Tea', 'Coffee', 'Rubber', 'Cashew', 'Coconut'],
      'Desert Soil': ['Bajra', 'Pulses', 'Barley', 'Maize'],
      'Clay Soil': ['Rice', 'Wheat', 'Sugarcane'],
      'Sandy Soil': ['Groundnut', 'Millets', 'Pulses'],
      'Loamy Soil': ['Wheat', 'Rice', 'Cotton', 'Sugarcane', 'Vegetables'],
    };

    return recommendations[soilType] || [];
  }

  /**
   * Format farm data as summary
   * @param farmData - Farm data
   * @returns Formatted summary
   */
  formatFarmSummary(farmData: FarmData): string {
    const category = this.getFarmCategory(farmData.farmSize);
    const crops = farmData.primaryCrops.join(', ');

    return `${category} - ${farmData.farmSize} acres\nCrops: ${crops}\nSoil: ${farmData.soilType}`;
  }
}

export const farmDataManager = new FarmDataManager();
