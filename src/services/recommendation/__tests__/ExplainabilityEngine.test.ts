/**
 * Explainability Engine Tests
 * Requirements: 3.5, 4.5, 6.7, 7.5, 10.5, 16.5
 */

import { ExplainabilityEngine } from '../ExplainabilityEngine';
import { EnhancedFarmingContext } from '../FarmingContextBuilder';
import { UserProfile } from '../../../types/profile.types';
import { SoilHealthData } from '../../../types/soil.types';
import { WeatherForecast } from '../../../types/weather.types';
import { MarketData } from '../../../types/market.types';

describe('ExplainabilityEngine', () => {
  let engine: ExplainabilityEngine;
  let mockContext: EnhancedFarmingContext;

  beforeEach(() => {
    engine = new ExplainabilityEngine();

    // Create mock context with all data
    const mockProfile: UserProfile = {
      userId: 'test-user',
      mobileNumber: '+919876543210',
      name: 'Test Farmer',
      location: {
        state: 'Maharashtra',
        district: 'Pune',
        village: 'Test Village',
        pincode: '411001',
        coordinates: { latitude: 18.5204, longitude: 73.8567 },
      },
      languagePreference: 'en',
      farmSize: 2.5,
      primaryCrops: ['Rice', 'Wheat'],
      soilType: 'loamy',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockSoilData: SoilHealthData = {
      id: 'soil-1',
      userId: 'test-user',
      testDate: new Date(),
      labName: 'Test Lab',
      sampleId: 'SAMPLE-001',
      location: {
        latitude: 28.6139,
        longitude: 77.209,
      },
      parameters: {
        pH: 6.5,
        nitrogen: 250,
        phosphorus: 20,
        potassium: 250,
        organicCarbon: 0.6,
        electricalConductivity: 0.5,
        zinc: 1.2,
        iron: 4.5,
        manganese: 3.0,
        copper: 0.8,
      },
      soilType: 'loamy',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockWeatherForecast: WeatherForecast = {
      location: {
        latitude: 18.5204,
        longitude: 73.8567,
        name: 'Pune, Maharashtra',
      },
      current: {
        date: new Date(),
        condition: 'partly_cloudy',
        temperature: {
          current: 26,
          min: 20,
          max: 32,
          feelsLike: 27,
        },
        humidity: 65,
        wind: {
          speed: 10,
          direction: 'NE',
        },
        precipitation: {
          probability: 10,
          amount: 5,
          type: 'rain',
        },
        uvIndex: 7,
        sunrise: new Date(),
        sunset: new Date(),
        description: 'Partly cloudy',
      },
      daily: [
        {
          date: new Date(),
          condition: 'partly_cloudy',
          temperature: {
            current: 26,
            min: 20,
            max: 32,
            feelsLike: 27,
          },
          humidity: 65,
          wind: {
            speed: 10,
            direction: 'NE',
          },
          precipitation: {
            probability: 10,
            amount: 5,
            type: 'rain',
          },
          uvIndex: 7,
          sunrise: new Date(),
          sunset: new Date(),
          description: 'Partly cloudy',
        },
      ],
      alerts: [],
      lastUpdated: new Date(),
      source: 'test',
    };

    const mockMarketData: MarketData = {
      prices: [
        {
          id: 'price-1',
          crop: 'Rice',
          mandiName: 'Test Mandi',
          mandiLocation: {
            state: 'Maharashtra',
            district: 'Pune',
            market: 'Test Mandi',
            latitude: 18.5204,
            longitude: 73.8567,
          },
          price: {
            min: 1900,
            max: 2100,
            modal: 2000,
            currency: 'INR',
          },
          unit: 'quintal',
          date: new Date(),
          source: 'test',
        },
      ],
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
      currentSeason: 'kharif',
      timestamp: new Date(),
      computed: {
        farmSizeCategory: 'small',
        soilHealthRating: 'good',
        weatherRisk: 'low',
        marketOpportunity: 'favorable',
        recommendationReadiness: 85,
      },
    };
  });

  describe('generateCropExplanation', () => {
    it('should generate explanation with all factors for crop recommendation', () => {
      const explanation = engine.generateCropExplanation(
        'Rice',
        {
          suitability: 85,
          profitability: 75,
          risk: 30,
          overall: 80,
        },
        mockContext
      );

      expect(explanation).toBeDefined();
      expect(explanation.summary).toContain('Rice');
      expect(explanation.factors).toHaveLength(5); // Season, Soil, Weather, Market, Farm Size
      expect(explanation.confidence).toBeGreaterThan(0);
      expect(explanation.confidence).toBeLessThanOrEqual(100);
      expect(explanation.reasoning).toContain('Rice');
    });

    it('should identify positive factors correctly', () => {
      const explanation = engine.generateCropExplanation(
        'Rice',
        { suitability: 90, profitability: 85, risk: 20, overall: 88 },
        mockContext
      );

      const positiveFactors = explanation.factors.filter(f => f.impact === 'positive');
      expect(positiveFactors.length).toBeGreaterThan(0);
      
      // Should have season, soil, weather, and market as positive
      expect(positiveFactors.some(f => f.name === 'Season')).toBe(true);
      expect(positiveFactors.some(f => f.name === 'Soil Condition')).toBe(true);
    });

    it('should use simple language without jargon', () => {
      const explanation = engine.generateCropExplanation(
        'Wheat',
        { suitability: 80, profitability: 70, risk: 35, overall: 75 },
        mockContext
      );

      // Check that explanation uses simple words
      expect(explanation.reasoning).not.toContain('NPK');
      expect(explanation.reasoning).not.toContain('quintals');
      expect(explanation.reasoning).not.toContain('hectare');
      
      // Should contain simple guidance
      expect(explanation.reasoning).toContain('recommend');
      expect(explanation.summary).toBeDefined();
    });

    it('should handle poor soil conditions', () => {
      const poorSoilContext = {
        ...mockContext,
        computed: {
          ...mockContext.computed,
          soilHealthRating: 'poor' as const,
        },
      };

      const explanation = engine.generateCropExplanation(
        'Cotton',
        { suitability: 60, profitability: 65, risk: 50, overall: 60 },
        poorSoilContext
      );

      const soilFactor = explanation.factors.find(f => f.name === 'Soil Condition');
      expect(soilFactor).toBeDefined();
      expect(soilFactor?.impact).toBe('negative');
      expect(soilFactor?.description).toContain('poor');
    });

    it('should handle high weather risk', () => {
      const highRiskContext = {
        ...mockContext,
        computed: {
          ...mockContext.computed,
          weatherRisk: 'high' as const,
        },
      };

      const explanation = engine.generateCropExplanation(
        'Maize',
        { suitability: 70, profitability: 60, risk: 60, overall: 65 },
        highRiskContext
      );

      const weatherFactor = explanation.factors.find(f => f.name === 'Weather');
      expect(weatherFactor).toBeDefined();
      expect(weatherFactor?.impact).toBe('negative');
      expect(weatherFactor?.description).toContain('monitoring');
    });
  });

  describe('generateFertilizerExplanation', () => {
    it('should generate explanation for nitrogen deficiency', () => {
      const lowNitrogenContext = {
        ...mockContext,
        soilData: {
          ...mockContext.soilData!,
          parameters: {
            ...mockContext.soilData!.parameters,
            nitrogen: 200, // Low nitrogen
          },
        },
      };

      const explanation = engine.generateFertilizerExplanation(
        'Urea',
        'Nitrogen',
        lowNitrogenContext
      );

      expect(explanation.factors.some(f => 
        f.name === 'Nitrogen Level' && f.impact === 'negative'
      )).toBe(true);
      
      const nitrogenFactor = explanation.factors.find(f => f.name === 'Nitrogen Level');
      expect(nitrogenFactor?.description).toContain('low nitrogen');
      expect(nitrogenFactor?.description).toContain('leaf growth');
    });

    it('should generate explanation for phosphorus deficiency', () => {
      const lowPhosphorusContext = {
        ...mockContext,
        soilData: {
          ...mockContext.soilData!,
          parameters: {
            ...mockContext.soilData!.parameters,
            phosphorus: 15, // Low phosphorus
          },
        },
      };

      const explanation = engine.generateFertilizerExplanation(
        'DAP',
        'Phosphorus',
        lowPhosphorusContext
      );

      const phosphorusFactor = explanation.factors.find(f => f.name === 'Phosphorus Level');
      expect(phosphorusFactor).toBeDefined();
      expect(phosphorusFactor?.impact).toBe('negative');
      expect(phosphorusFactor?.description).toContain('roots');
    });

    it('should generate explanation for potassium deficiency', () => {
      const lowPotassiumContext = {
        ...mockContext,
        soilData: {
          ...mockContext.soilData!,
          parameters: {
            ...mockContext.soilData!.parameters,
            potassium: 200, // Low potassium
          },
        },
      };

      const explanation = engine.generateFertilizerExplanation(
        'MOP',
        'Potassium',
        lowPotassiumContext
      );

      const potassiumFactor = explanation.factors.find(f => f.name === 'Potassium Level');
      expect(potassiumFactor).toBeDefined();
      expect(potassiumFactor?.impact).toBe('negative');
      expect(potassiumFactor?.description).toContain('disease resistance');
    });

    it('should warn about high nutrient levels', () => {
      const highNitrogenContext = {
        ...mockContext,
        soilData: {
          ...mockContext.soilData!,
          parameters: {
            ...mockContext.soilData!.parameters,
            nitrogen: 450, // High nitrogen
          },
        },
      };

      const explanation = engine.generateFertilizerExplanation(
        'Urea',
        'Nitrogen',
        highNitrogenContext
      );

      const nitrogenFactor = explanation.factors.find(f => f.name === 'Nitrogen Level');
      expect(nitrogenFactor).toBeDefined();
      expect(nitrogenFactor?.impact).toBe('positive');
      expect(nitrogenFactor?.description).toContain('carefully');
    });

    it('should handle missing soil data', () => {
      const noSoilContext = {
        ...mockContext,
        soilData: null,
      };

      const explanation = engine.generateFertilizerExplanation(
        'NPK',
        'NPK',
        noSoilContext
      );

      expect(explanation.factors.length).toBeGreaterThan(0);
      expect(explanation.factors[0].name).toBe('General Recommendation');
    });

    it('should mention organic matter when low', () => {
      const lowOrganicContext = {
        ...mockContext,
        soilData: {
          ...mockContext.soilData!,
          parameters: {
            ...mockContext.soilData!.parameters,
            organicCarbon: 0.3, // Low organic carbon
          },
        },
      };

      const explanation = engine.generateFertilizerExplanation(
        'FYM',
        'Nitrogen',
        lowOrganicContext
      );

      const organicFactor = explanation.factors.find(f => f.name === 'Soil Health');
      expect(organicFactor).toBeDefined();
      expect(organicFactor?.description).toContain('organic matter');
      expect(organicFactor?.description).toContain('compost');
    });
  });

  describe('generateSeedExplanation', () => {
    it('should generate explanation for seed recommendation', () => {
      const explanation = engine.generateSeedExplanation(
        'BPT 5204',
        'Rice',
        mockContext
      );

      expect(explanation.summary).toContain('BPT 5204');
      expect(explanation.factors.length).toBeGreaterThan(0);
      expect(explanation.reasoning).toContain('certified seeds');
    });

    it('should include season timing factor', () => {
      const explanation = engine.generateSeedExplanation(
        'HD 2967',
        'Wheat',
        mockContext
      );

      const seasonFactor = explanation.factors.find(f => f.name === 'Planting Season');
      expect(seasonFactor).toBeDefined();
      expect(seasonFactor?.impact).toBe('positive');
      expect(seasonFactor?.description).toContain('season');
    });

    it('should include disease resistance factor', () => {
      const explanation = engine.generateSeedExplanation(
        'Bt Cotton',
        'Cotton',
        mockContext
      );

      const diseaseFactor = explanation.factors.find(f => f.name === 'Disease Protection');
      expect(diseaseFactor).toBeDefined();
      expect(diseaseFactor?.impact).toBe('positive');
    });
  });

  describe('generateSoilExplanation', () => {
    it('should explain acidic soil', () => {
      const acidicSoilContext = {
        ...mockContext,
        soilData: {
          ...mockContext.soilData!,
          parameters: {
            ...mockContext.soilData!.parameters,
            pH: 5.5, // Acidic
          },
        },
      };

      const explanation = engine.generateSoilExplanation(
        'Lime Application',
        acidicSoilContext
      );

      const phFactor = explanation.factors.find(f => f.name === 'Soil Acidity');
      expect(phFactor).toBeDefined();
      expect(phFactor?.impact).toBe('negative');
      expect(phFactor?.description).toContain('acidic');
      expect(phFactor?.description).toContain('lime');
    });

    it('should explain alkaline soil', () => {
      const alkalineSoilContext = {
        ...mockContext,
        soilData: {
          ...mockContext.soilData!,
          parameters: {
            ...mockContext.soilData!.parameters,
            pH: 8.5, // Alkaline
          },
        },
      };

      const explanation = engine.generateSoilExplanation(
        'Organic Matter Addition',
        alkalineSoilContext
      );

      const phFactor = explanation.factors.find(f => f.name === 'Soil Alkalinity');
      expect(phFactor).toBeDefined();
      expect(phFactor?.impact).toBe('negative');
      expect(phFactor?.description).toContain('alkaline');
    });

    it('should identify multiple nutrient deficiencies', () => {
      const deficientSoilContext = {
        ...mockContext,
        soilData: {
          ...mockContext.soilData!,
          parameters: {
            ...mockContext.soilData!.parameters,
            nitrogen: 200,
            phosphorus: 15,
            potassium: 200,
          },
        },
      };

      const explanation = engine.generateSoilExplanation(
        'Balanced Fertilization',
        deficientSoilContext
      );

      const nutrientFactor = explanation.factors.find(f => f.name === 'Nutrient Levels');
      expect(nutrientFactor).toBeDefined();
      expect(nutrientFactor?.impact).toBe('negative');
      expect(nutrientFactor?.description).toContain('nitrogen');
      expect(nutrientFactor?.description).toContain('phosphorus');
      expect(nutrientFactor?.description).toContain('potassium');
    });

    it('should recognize good soil conditions', () => {
      // Create context with good nutrient levels
      const goodSoilContext = {
        ...mockContext,
        soilData: {
          ...mockContext.soilData!,
          parameters: {
            ...mockContext.soilData!.parameters,
            nitrogen: 350, // Good level
            phosphorus: 35, // Good level
            potassium: 350, // Good level
          },
        },
      };

      const explanation = engine.generateSoilExplanation(
        'Maintenance',
        goodSoilContext
      );

      const phFactor = explanation.factors.find(f => f.name === 'Soil pH');
      expect(phFactor?.impact).toBe('positive');
      
      const nutrientFactor = explanation.factors.find(f => f.name === 'Nutrient Levels');
      expect(nutrientFactor?.impact).toBe('positive');
    });
  });

  describe('generateWeatherExplanation', () => {
    it('should warn about heavy rain', () => {
      const heavyRainContext = {
        ...mockContext,
        weatherForecast: {
          ...mockContext.weatherForecast!,
          daily: [
            {
              date: new Date(),
              condition: 'heavy_rain' as const,
              temperature: {
                current: 26,
                min: 22,
                max: 30,
                feelsLike: 27,
              },
              precipitation: {
                probability: 90,
                amount: 75,
                type: 'rain' as const,
              },
              humidity: 85,
              wind: {
                speed: 15,
                direction: 'NE',
              },
              uvIndex: 3,
              sunrise: new Date(),
              sunset: new Date(),
              description: 'Heavy rain',
            },
          ],
        },
      };

      const explanation = engine.generateWeatherExplanation(
        'Delay field work',
        heavyRainContext
      );

      const rainFactor = explanation.factors.find(f => f.name === 'Heavy Rain Expected');
      expect(rainFactor).toBeDefined();
      expect(rainFactor?.impact).toBe('negative');
      expect(rainFactor?.description).toContain('Delay');
    });

    it('should warn about high temperature', () => {
      const hotWeatherContext = {
        ...mockContext,
        weatherForecast: {
          ...mockContext.weatherForecast!,
          daily: [
            {
              date: new Date(),
              condition: 'clear' as const,
              temperature: {
                current: 35,
                min: 28,
                max: 42,
                feelsLike: 45,
              },
              precipitation: {
                probability: 0,
                amount: 0,
                type: 'none' as const,
              },
              humidity: 40,
              wind: {
                speed: 10,
                direction: 'W',
              },
              uvIndex: 10,
              sunrise: new Date(),
              sunset: new Date(),
              description: 'Hot and dry',
            },
          ],
        },
      };

      const explanation = engine.generateWeatherExplanation(
        'Increase irrigation',
        hotWeatherContext
      );

      const tempFactor = explanation.factors.find(f => f.name === 'High Temperature');
      expect(tempFactor).toBeDefined();
      expect(tempFactor?.impact).toBe('negative');
      expect(tempFactor?.description).toContain('irrigation');
    });

    it('should warn about cold weather', () => {
      const coldWeatherContext = {
        ...mockContext,
        weatherForecast: {
          ...mockContext.weatherForecast!,
          daily: [
            {
              date: new Date(),
              condition: 'clear' as const,
              temperature: {
                current: 12,
                min: 5,
                max: 18,
                feelsLike: 8,
              },
              precipitation: {
                probability: 0,
                amount: 0,
                type: 'none' as const,
              },
              humidity: 60,
              wind: {
                speed: 8,
                direction: 'N',
              },
              uvIndex: 5,
              sunrise: new Date(),
              sunset: new Date(),
              description: 'Cold',
            },
          ],
        },
      };

      const explanation = engine.generateWeatherExplanation(
        'Protect crops',
        coldWeatherContext
      );

      const tempFactor = explanation.factors.find(f => f.name === 'Low Temperature');
      expect(tempFactor).toBeDefined();
      expect(tempFactor?.impact).toBe('negative');
      expect(tempFactor?.description).toContain('Protect');
    });

    it('should warn about high humidity', () => {
      const humidWeatherContext = {
        ...mockContext,
        weatherForecast: {
          ...mockContext.weatherForecast!,
          daily: [
            {
              date: new Date(),
              condition: 'cloudy' as const,
              temperature: {
                current: 28,
                min: 24,
                max: 32,
                feelsLike: 30,
              },
              precipitation: {
                probability: 30,
                amount: 10,
                type: 'rain' as const,
              },
              humidity: 90,
              wind: {
                speed: 5,
                direction: 'SE',
              },
              uvIndex: 6,
              sunrise: new Date(),
              sunset: new Date(),
              description: 'Humid',
            },
          ],
        },
      };

      const explanation = engine.generateWeatherExplanation(
        'Monitor for diseases',
        humidWeatherContext
      );

      const humidityFactor = explanation.factors.find(f => f.name === 'High Humidity');
      expect(humidityFactor).toBeDefined();
      expect(humidityFactor?.impact).toBe('negative');
      expect(humidityFactor?.description).toContain('disease');
    });

    it('should warn about strong winds', () => {
      const windyWeatherContext = {
        ...mockContext,
        weatherForecast: {
          ...mockContext.weatherForecast!,
          daily: [
            {
              date: new Date(),
              condition: 'clear' as const,
              temperature: {
                current: 25,
                min: 20,
                max: 30,
                feelsLike: 24,
              },
              precipitation: {
                probability: 0,
                amount: 0,
                type: 'none' as const,
              },
              humidity: 50,
              wind: {
                speed: 35,
                direction: 'W',
              },
              uvIndex: 8,
              sunrise: new Date(),
              sunset: new Date(),
              description: 'Windy',
            },
          ],
        },
      };

      const explanation = engine.generateWeatherExplanation(
        'Avoid spraying',
        windyWeatherContext
      );

      const windFactor = explanation.factors.find(f => f.name === 'Strong Wind');
      expect(windFactor).toBeDefined();
      expect(windFactor?.impact).toBe('negative');
      expect(windFactor?.description).toContain('spraying');
    });

    it('should recognize good weather', () => {
      const explanation = engine.generateWeatherExplanation(
        'Good for field work',
        mockContext
      );

      const weatherFactor = explanation.factors.find(f => f.name === 'Dry Weather');
      expect(weatherFactor).toBeDefined();
      expect(weatherFactor?.impact).toBe('positive');
    });
  });

  describe('confidence calculation', () => {
    it('should calculate confidence based on data completeness', () => {
      const explanation = engine.generateCropExplanation(
        'Rice',
        { suitability: 85, profitability: 80, risk: 25, overall: 82 },
        mockContext
      );

      expect(explanation.confidence).toBeGreaterThanOrEqual(80);
      expect(explanation.confidence).toBeLessThanOrEqual(100);
    });

    it('should increase confidence when factors are aligned', () => {
      // All positive factors
      const goodContext = {
        ...mockContext,
        computed: {
          farmSizeCategory: 'small' as const,
          soilHealthRating: 'excellent' as const,
          weatherRisk: 'low' as const,
          marketOpportunity: 'favorable' as const,
          recommendationReadiness: 80,
        },
      };

      const explanation = engine.generateCropExplanation(
        'Rice',
        { suitability: 95, profitability: 90, risk: 15, overall: 92 },
        goodContext
      );

      expect(explanation.confidence).toBeGreaterThan(80);
    });

    it('should handle low data completeness', () => {
      const incompleteContext = {
        ...mockContext,
        soilData: null,
        weatherForecast: null,
        marketData: null,
        computed: {
          ...mockContext.computed,
          recommendationReadiness: 40,
        },
      };

      const explanation = engine.generateCropExplanation(
        'Rice',
        { suitability: 60, profitability: 55, risk: 50, overall: 58 },
        incompleteContext
      );

      expect(explanation.confidence).toBeLessThan(60);
    });
  });

  describe('factor weighting', () => {
    it('should sort factors by weight', () => {
      const explanation = engine.generateCropExplanation(
        'Rice',
        { suitability: 85, profitability: 80, risk: 30, overall: 80 },
        mockContext
      );

      // Factors should be sorted by weight (descending)
      for (let i = 0; i < explanation.factors.length - 1; i++) {
        expect(explanation.factors[i].weight).toBeGreaterThanOrEqual(
          explanation.factors[i + 1].weight
        );
      }
    });

    it('should assign appropriate weights to different factors', () => {
      const explanation = engine.generateCropExplanation(
        'Rice',
        { suitability: 85, profitability: 80, risk: 30, overall: 80 },
        mockContext
      );

      // Season and soil should have higher weights
      const seasonFactor = explanation.factors.find(f => f.name === 'Season');
      const soilFactor = explanation.factors.find(f => f.name === 'Soil Condition');
      const farmSizeFactor = explanation.factors.find(f => f.name === 'Farm Size');

      expect(seasonFactor?.weight).toBeGreaterThan(farmSizeFactor?.weight || 0);
      expect(soilFactor?.weight).toBeGreaterThan(farmSizeFactor?.weight || 0);
    });
  });

  describe('simple language requirement', () => {
    it('should avoid technical jargon in all explanations', () => {
      const cropExplanation = engine.generateCropExplanation(
        'Rice',
        { suitability: 85, profitability: 80, risk: 30, overall: 80 },
        mockContext
      );

      const fertilizerExplanation = engine.generateFertilizerExplanation(
        'Urea',
        'Nitrogen',
        mockContext
      );

      const seedExplanation = engine.generateSeedExplanation(
        'BPT 5204',
        'Rice',
        mockContext
      );

      // Check for absence of technical terms (use word boundaries to avoid false positives)
      const jargonTerms = ['quintals', 'hectare', 'NPK ratio', '\\bEC\\b', '\\bppm\\b'];
      
      [cropExplanation, fertilizerExplanation, seedExplanation].forEach(exp => {
        jargonTerms.forEach(term => {
          const regex = new RegExp(term, 'i');
          expect(exp.reasoning).not.toMatch(regex);
        });
      });
    });

    it('should use farmer-friendly language', () => {
      const explanation = engine.generateCropExplanation(
        'Wheat',
        { suitability: 80, profitability: 75, risk: 35, overall: 75 },
        mockContext
      );

      // Should contain simple, actionable language
      const friendlyTerms = ['good', 'suitable', 'recommend', 'your farm', 'best'];
      const hasFriendlyLanguage = friendlyTerms.some(term =>
        explanation.reasoning.toLowerCase().includes(term)
      );

      expect(hasFriendlyLanguage).toBe(true);
    });
  });
});
