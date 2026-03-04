/**
 * Unit tests for Farm Data Manager
 */

import { farmDataManager } from '../FarmDataManager';
import { FarmData } from '../../../types/profile.types';

describe('FarmDataManager', () => {
  const validFarmData: FarmData = {
    farmSize: 5,
    primaryCrops: ['Rice', 'Wheat'],
    soilType: 'Alluvial Soil',
  };

  describe('validateFarmData', () => {
    it('should validate correct farm data', () => {
      const result = farmDataManager.validateFarmData(validFarmData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject zero farm size', () => {
      const farmData = { ...validFarmData, farmSize: 0 };
      const result = farmDataManager.validateFarmData(farmData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Farm size must be greater than 0');
    });

    it('should warn about unusually large farm size', () => {
      const farmData = { ...validFarmData, farmSize: 15000 };
      const result = farmDataManager.validateFarmData(farmData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Farm size seems unusually large. Please verify.');
    });

    it('should reject empty crops array', () => {
      const farmData = { ...validFarmData, primaryCrops: [] };
      const result = farmDataManager.validateFarmData(farmData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one primary crop must be specified');
    });

    it('should reject empty soil type', () => {
      const farmData = { ...validFarmData, soilType: '' };
      const result = farmDataManager.validateFarmData(farmData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Soil type is required');
    });
  });

  describe('getFarmCategory', () => {
    it('should categorize marginal farmer', () => {
      const category = farmDataManager.getFarmCategory(2);
      expect(category).toBe('Marginal Farmer');
    });

    it('should categorize small farmer', () => {
      const category = farmDataManager.getFarmCategory(3);
      expect(category).toBe('Small Farmer');
    });

    it('should categorize semi-medium farmer', () => {
      const category = farmDataManager.getFarmCategory(7);
      expect(category).toBe('Semi-Medium Farmer');
    });

    it('should categorize medium farmer', () => {
      const category = farmDataManager.getFarmCategory(15);
      expect(category).toBe('Medium Farmer');
    });

    it('should categorize large farmer', () => {
      const category = farmDataManager.getFarmCategory(30);
      expect(category).toBe('Large Farmer');
    });
  });

  describe('getCommonCrops', () => {
    it('should return list of common crops', () => {
      const crops = farmDataManager.getCommonCrops();

      expect(crops).toContain('Rice');
      expect(crops).toContain('Wheat');
      expect(crops).toContain('Cotton');
      expect(crops.length).toBeGreaterThan(10);
    });
  });

  describe('getCommonSoilTypes', () => {
    it('should return list of common soil types', () => {
      const soilTypes = farmDataManager.getCommonSoilTypes();

      expect(soilTypes).toContain('Alluvial Soil');
      expect(soilTypes).toContain('Black Soil (Regur)');
      expect(soilTypes).toContain('Red Soil');
      expect(soilTypes.length).toBeGreaterThan(5);
    });
  });

  describe('getRecommendedCropsForSoil', () => {
    it('should return recommended crops for alluvial soil', () => {
      const crops = farmDataManager.getRecommendedCropsForSoil('Alluvial Soil');

      expect(crops).toContain('Rice');
      expect(crops).toContain('Wheat');
      expect(crops.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown soil type', () => {
      const crops = farmDataManager.getRecommendedCropsForSoil('Unknown Soil');

      expect(crops).toEqual([]);
    });
  });

  describe('formatFarmSummary', () => {
    it('should format farm data as summary', () => {
      const summary = farmDataManager.formatFarmSummary(validFarmData);

      expect(summary).toContain('Semi-Medium Farmer');
      expect(summary).toContain('5 acres');
      expect(summary).toContain('Rice, Wheat');
      expect(summary).toContain('Alluvial Soil');
    });
  });
});
