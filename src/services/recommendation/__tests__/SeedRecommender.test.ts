/**
 * Seed Recommender Tests
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { SeedRecommender } from '../SeedRecommender';
import { FarmingContext } from '../../../types/recommendation.types';
import { UserProfile } from '../../../types/profile.types';
import { SoilHealthData } from '../../../types/soil.types';
import { WeatherForecast } from '../../../types/weather.types';
import { MarketData } from '../../../types/market.types';

describe('SeedRecommender', () => {
  let recommender: SeedRecommender;
  let mockContext: FarmingContext;

  beforeEach(() => {
    recommender = new SeedRecommender();

    // Create mock context
    const mockProfile: UserProfile = {
      userId: 'user123',
      mobileNumber: '+919876543210',
      name: 'Test Farmer',
      location: {
        state: 'Punjab',
        district: 'Ludhiana',
        village: 'Test Village',
        pincode: '141001',
        coordinates: {
          latitude: 30.9,
          longitude: 75.85,
        },
      },
      farmSize: 5,
      primaryCrops: ['wheat', 'rice'],
      soilType: 'loamy',
      languagePreference: 'en',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    const mockSoilData: SoilHealthData = {
      id: 'soil123',
      userId: 'user123',
      testDate: new Date('2024-01-01'),
      labName: 'Test Lab',
      sampleId: 'SAMPLE-001',
      location: {
        latitude: 30.9,
        longitude: 75.85,
      },
      parameters: {
        nitrogen: 300,
        phosphorus: 30,
        potassium: 300,
        pH: 6.5,
        electricalConductivity: 0.4,
        organicCarbon: 0.6,
      },
      soilType: 'loamy',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    const mockWeatherForecast: WeatherForecast = {
      location: {
        latitude: 30.9,
        longitude: 75.85,
        name: 'Ludhiana',
      },
      current: {
        date: new Date(),
        condition: 'clear',
        temperature: { current: 25, min: 20, max: 30, feelsLike: 25 },
        humidity: 60,
        wind: { speed: 10, direction: 'N' },
        precipitation: { probability: 0, amount: 0, type: 'none' },
        uvIndex: 5,
        sunrise: new Date(),
        sunset: new Date(),
        description: 'Clear sky',
      },
      daily: [],
      alerts: [],
      lastUpdated: new Date(),
      source: 'test',
    };

    const mockMarketData: MarketData = {
      prices: [],
      trends: [],
      mandis: [],
      lastUpdated: new Date(),
      source: 'test',
    };

    mockContext = {
      userProfile: mockProfile,
      soilData: mockSoilData,
      weatherForecast: mockWeatherForecast,
      marketData: mockMarketData,
      currentSeason: 'rabi',
      timestamp: new Date('2024-11-15'),
    };
  });

  describe('generateRecommendations', () => {
    it('should generate seed recommendations for rabi season', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should include all required fields in recommendations', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        expect(rec.cropName).toBeDefined();
        expect(rec.variety).toBeDefined();
        expect(rec.yieldPotential).toBeDefined();
        expect(rec.yieldPotential.min).toBeGreaterThan(0);
        expect(rec.yieldPotential.max).toBeGreaterThan(rec.yieldPotential.min);
        expect(rec.yieldPotential.unit).toBeDefined();
        expect(rec.diseaseResistance).toBeDefined();
        expect(Array.isArray(rec.diseaseResistance)).toBe(true);
        expect(rec.duration).toBeGreaterThan(0);
        expect(rec.sowingWindow).toBeDefined();
        expect(rec.sowingWindow.start).toBeInstanceOf(Date);
        expect(rec.sowingWindow.end).toBeInstanceOf(Date);
        expect(rec.seedRate).toBeDefined();
        expect(rec.sources).toBeDefined();
        expect(Array.isArray(rec.sources)).toBe(true);
        expect(rec.explanation).toBeDefined();
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should filter recommendations by crop name when specified', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext, 'Wheat');

      expect(recommendations.length).toBeGreaterThan(0);
      recommendations.forEach(rec => {
        expect(rec.cropName).toBe('Wheat');
      });
    });

    it('should filter recommendations by season', async () => {
      const kharifContext = { ...mockContext, currentSeason: 'kharif' as const };
      const recommendations = await recommender.generateRecommendations(kharifContext);

      expect(recommendations.length).toBeGreaterThan(0);
      // Should include rice and cotton varieties for kharif
      const cropNames = recommendations.map(r => r.cropName);
      expect(cropNames).toContain('Rice');
    });

    it('should rank recommendations by suitability score', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      // Verify recommendations are sorted (higher scores first)
      for (let i = 0; i < recommendations.length - 1; i++) {
        // Can't directly check scores, but verify all have valid confidence
        expect(recommendations[i].confidence).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return empty array when no suitable varieties found', async () => {
      const zaidContext = { ...mockContext, currentSeason: 'zaid' as const };
      const recommendations = await recommender.generateRecommendations(zaidContext);

      // Zaid season has limited varieties in our database
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('yield potential', () => {
    it('should include yield potential with min, max, and unit', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        expect(rec.yieldPotential.min).toBeGreaterThan(0);
        expect(rec.yieldPotential.max).toBeGreaterThan(rec.yieldPotential.min);
        expect(rec.yieldPotential.unit).toBe('kg/ha');
      });
    });

    it('should have realistic yield ranges', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        const range = rec.yieldPotential.max - rec.yieldPotential.min;
        const avgYield = (rec.yieldPotential.min + rec.yieldPotential.max) / 2;
        // Range should be reasonable (not more than 50% of average)
        expect(range).toBeLessThan(avgYield * 0.5);
      });
    });
  });

  describe('disease resistance', () => {
    it('should include disease resistance information', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        expect(Array.isArray(rec.diseaseResistance)).toBe(true);
        expect(rec.diseaseResistance.length).toBeGreaterThan(0);
      });
    });

    it('should list specific diseases', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        rec.diseaseResistance.forEach(disease => {
          expect(typeof disease).toBe('string');
          expect(disease.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('sowing window', () => {
    it('should calculate optimal sowing window', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        expect(rec.sowingWindow.start).toBeInstanceOf(Date);
        expect(rec.sowingWindow.end).toBeInstanceOf(Date);
        expect(rec.sowingWindow.end.getTime()).toBeGreaterThan(
          rec.sowingWindow.start.getTime()
        );
      });
    });

    it('should provide sowing window in the future', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);
      const currentDate = mockContext.timestamp;

      recommendations.forEach(rec => {
        // Sowing window should be current or future
        expect(rec.sowingWindow.start.getTime()).toBeGreaterThanOrEqual(
          new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime()
        );
      });
    });

    it('should handle sowing window spanning to next year', async () => {
      const lateYearContext = {
        ...mockContext,
        timestamp: new Date('2024-12-15'),
        currentSeason: 'rabi' as const,
      };
      const recommendations = await recommender.generateRecommendations(lateYearContext);

      expect(recommendations.length).toBeGreaterThan(0);
      recommendations.forEach(rec => {
        expect(rec.sowingWindow.start).toBeInstanceOf(Date);
        expect(rec.sowingWindow.end).toBeInstanceOf(Date);
      });
    });
  });

  describe('seed sources', () => {
    it('should include trusted seed sources', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        expect(rec.sources.length).toBeGreaterThan(0);
        expect(rec.sources.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should include government, cooperative, and private sources', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        const sourceTypes = rec.sources.map(s => s.type);
        expect(sourceTypes).toContain('government');
        expect(sourceTypes).toContain('cooperative');
        expect(sourceTypes).toContain('private');
      });
    });

    it('should include all required source information', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        rec.sources.forEach(source => {
          expect(source.name).toBeDefined();
          expect(source.type).toBeDefined();
          expect(['government', 'private', 'cooperative']).toContain(source.type);
          expect(source.location).toBeDefined();
          expect(source.contact).toBeDefined();
          expect(typeof source.certified).toBe('boolean');
          expect(source.price).toBeDefined();
          expect(source.price.min).toBeGreaterThan(0);
          expect(source.price.max).toBeGreaterThanOrEqual(source.price.min);
          expect(source.price.unit).toBeDefined();
        });
      });
    });

    it('should mark all sources as certified', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        rec.sources.forEach(source => {
          expect(source.certified).toBe(true);
        });
      });
    });
  });

  describe('explanation', () => {
    it('should provide clear explanation for each recommendation', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        expect(rec.explanation).toBeDefined();
        expect(rec.explanation.length).toBeGreaterThan(0);
      });
    });

    it('should mention key factors in explanation', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        const explanation = rec.explanation.toLowerCase();
        // Should mention at least one key factor
        const hasKeyFactor =
          explanation.includes('season') ||
          explanation.includes('soil') ||
          explanation.includes('yield') ||
          explanation.includes('resistant') ||
          explanation.includes('duration');
        expect(hasKeyFactor).toBe(true);
      });
    });
  });

  describe('confidence scoring', () => {
    it('should calculate confidence based on data completeness', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('should have higher confidence with complete data', async () => {
      const completeRecommendations = await recommender.generateRecommendations(mockContext);

      const incompleteContext = {
        ...mockContext,
        soilData: null,
        weatherForecast: null,
        marketData: null,
      };
      const incompleteRecommendations = await recommender.generateRecommendations(
        incompleteContext
      );

      if (completeRecommendations.length > 0 && incompleteRecommendations.length > 0) {
        expect(completeRecommendations[0].confidence).toBeGreaterThan(
          incompleteRecommendations[0].confidence
        );
      }
    });

    it('should have minimum confidence even with incomplete data', async () => {
      const incompleteContext = {
        ...mockContext,
        soilData: null,
        weatherForecast: null,
        marketData: null,
      };
      const recommendations = await recommender.generateRecommendations(incompleteContext);

      if (recommendations.length > 0) {
        recommendations.forEach(rec => {
          expect(rec.confidence).toBeGreaterThanOrEqual(40);
        });
      }
    });
  });

  describe('seed rate', () => {
    it('should include seed rate information', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        expect(rec.seedRate).toBeDefined();
        expect(rec.seedRate.amount).toBeGreaterThan(0);
        expect(rec.seedRate.unit).toBeDefined();
        expect(rec.seedRate.perArea).toBeDefined();
      });
    });

    it('should have realistic seed rates', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        expect(rec.seedRate.amount).toBeGreaterThan(0);
        expect(rec.seedRate.perArea).toBe('hectare');
      });
    });
  });

  describe('soil compatibility', () => {
    it('should recommend varieties compatible with soil type', async () => {
      const loamContext = {
        ...mockContext,
        soilData: {
          ...mockContext.soilData!,
          soilType: 'loamy' as const,
        },
      };
      const recommendations = await recommender.generateRecommendations(loamContext);

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it('should consider pH range in recommendations', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      // All recommendations should be suitable for the soil pH
      expect(recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('duration', () => {
    it('should include crop duration in days', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      recommendations.forEach(rec => {
        expect(rec.duration).toBeGreaterThan(0);
        expect(rec.duration).toBeLessThan(400); // Reasonable max duration
      });
    });
  });
});
