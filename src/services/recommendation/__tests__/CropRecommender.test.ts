/**
 * Crop Recommender Tests
 */

import { CropRecommender } from '../CropRecommender';
import { EnhancedFarmingContext } from '../FarmingContextBuilder';
import { UserProfile } from '../../../types/profile.types';
import { SoilHealthData } from '../../../types/soil.types';
import { WeatherForecast, DailyForecast } from '../../../types/weather.types';
import { MarketData } from '../../../types/market.types';

describe('CropRecommender', () => {
  let recommender: CropRecommender;

  const mockProfile: UserProfile = {
    userId: 'user-001',
    mobileNumber: '+919876543210',
    name: 'Test Farmer',
    languagePreference: 'en',
    location: {
      state: 'Test State',
      district: 'Test District',
      village: 'Test Village',
      pincode: '123456',
      coordinates: {
        latitude: 28.6139,
        longitude: 77.209,
      },
    },
    farmSize: 5,
    primaryCrops: ['Rice'],
    soilType: 'loamy',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSoilData: SoilHealthData = {
    id: 'soil-001',
    userId: 'user-001',
    testDate: new Date(),
    labName: 'Test Lab',
    sampleId: 'SAMPLE-001',
    location: {
      latitude: 28.6139,
      longitude: 77.209,
    },
    parameters: {
      nitrogen: 300,
      phosphorus: 30,
      potassium: 250,
      pH: 6.5,
      electricalConductivity: 0.5,
      organicCarbon: 0.6,
    },
    soilType: 'loamy',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDailyForecast: DailyForecast = {
    date: new Date(),
    temperature: {
      current: 25,
      min: 20,
      max: 30,
      feelsLike: 26,
    },
    precipitation: {
      probability: 20,
      amount: 5,
      type: 'rain',
    },
    humidity: 60,
    wind: {
      speed: 15,
      direction: 'NE',
    },
    uvIndex: 7,
    condition: 'partly_cloudy',
    sunrise: new Date(),
    sunset: new Date(),
    description: 'Partly cloudy with light rain',
  };

  const mockWeatherForecast: WeatherForecast = {
    location: {
      latitude: 28.6139,
      longitude: 77.209,
      name: 'Test Location',
    },
    current: mockDailyForecast,
    daily: [mockDailyForecast],
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

  const mockContext: EnhancedFarmingContext = {
    userProfile: mockProfile,
    soilData: mockSoilData,
    weatherForecast: mockWeatherForecast,
    marketData: mockMarketData,
    currentSeason: 'kharif',
    timestamp: new Date(),
    computed: {
      farmSizeCategory: 'medium',
      soilHealthRating: 'good',
      weatherRisk: 'low',
      marketOpportunity: 'favorable',
      recommendationReadiness: 100,
    },
  };

  beforeEach(() => {
    recommender = new CropRecommender();
  });

  describe('generateRecommendations', () => {
    it('should generate crop recommendations', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      expect(recommendations).toBeDefined();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should include all required fields in recommendations', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);
      const recommendation = recommendations[0];

      expect(recommendation.cropName).toBeDefined();
      expect(recommendation.suitabilityScore).toBeGreaterThanOrEqual(0);
      expect(recommendation.suitabilityScore).toBeLessThanOrEqual(100);
      expect(recommendation.profitabilityScore).toBeGreaterThanOrEqual(0);
      expect(recommendation.profitabilityScore).toBeLessThanOrEqual(100);
      expect(recommendation.riskScore).toBeGreaterThanOrEqual(0);
      expect(recommendation.riskScore).toBeLessThanOrEqual(100);
      expect(recommendation.overallScore).toBeGreaterThanOrEqual(0);
      expect(recommendation.overallScore).toBeLessThanOrEqual(100);
      expect(recommendation.cultivationPlan).toBeDefined();
      expect(recommendation.explanation).toBeDefined();
      expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(100);
    });

    it('should rank recommendations by overall score', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].overallScore).toBeGreaterThanOrEqual(
          recommendations[i + 1].overallScore
        );
      }
    });

    it('should limit recommendations to specified number', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext, 3);

      expect(recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should complete within 5 seconds', async () => {
      const startTime = Date.now();
      await recommender.generateRecommendations(mockContext);
      const elapsedTime = Date.now() - startTime;

      expect(elapsedTime).toBeLessThan(5000);
    });

    it('should recommend season-appropriate crops', async () => {
      const kharifContext = { ...mockContext, currentSeason: 'kharif' as const };
      const recommendations = await recommender.generateRecommendations(kharifContext);

      // Rice and Cotton are kharif crops
      const cropNames = recommendations.map((r) => r.cropName);
      expect(cropNames).toContain('Rice');
    });

    it('should adjust scores based on market conditions', async () => {
      const favorableContext = {
        ...mockContext,
        computed: {
          ...mockContext.computed,
          marketOpportunity: 'favorable' as const,
        },
      };

      const unfavorableContext = {
        ...mockContext,
        computed: {
          ...mockContext.computed,
          marketOpportunity: 'unfavorable' as const,
        },
      };

      const favorableRecs = await recommender.generateRecommendations(favorableContext);
      const unfavorableRecs = await recommender.generateRecommendations(unfavorableContext);

      // Find Rice in both
      const favorableRice = favorableRecs.find((r) => r.cropName === 'Rice');
      const unfavorableRice = unfavorableRecs.find((r) => r.cropName === 'Rice');

      if (favorableRice && unfavorableRice) {
        expect(favorableRice.profitabilityScore).toBeGreaterThan(
          unfavorableRice.profitabilityScore
        );
      }
    });

    it('should adjust risk based on weather conditions', async () => {
      const lowRiskContext = {
        ...mockContext,
        computed: {
          ...mockContext.computed,
          weatherRisk: 'low' as const,
        },
      };

      const highRiskContext = {
        ...mockContext,
        computed: {
          ...mockContext.computed,
          weatherRisk: 'high' as const,
        },
      };

      const lowRiskRecs = await recommender.generateRecommendations(lowRiskContext);
      const highRiskRecs = await recommender.generateRecommendations(highRiskContext);

      // Find same crop in both
      const lowRiskCrop = lowRiskRecs[0];
      const highRiskCrop = highRiskRecs.find((r) => r.cropName === lowRiskCrop.cropName);

      if (highRiskCrop) {
        expect(highRiskCrop.riskScore).toBeGreaterThan(lowRiskCrop.riskScore);
      }
    });
  });

  describe('cultivationPlan', () => {
    it('should include complete cultivation plan', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);
      const plan = recommendations[0].cultivationPlan;

      expect(plan.cropName).toBeDefined();
      expect(plan.duration).toBeGreaterThan(0);
      expect(plan.activities).toBeDefined();
      expect(plan.activities.length).toBeGreaterThan(0);
      expect(plan.estimatedCost).toBeDefined();
      expect(plan.estimatedYield).toBeDefined();
    });

    it('should include all activity details', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);
      const activity = recommendations[0].cultivationPlan.activities[0];

      expect(activity.id).toBeDefined();
      expect(activity.name).toBeDefined();
      expect(activity.description).toBeDefined();
      expect(activity.timing).toBeDefined();
      expect(activity.daysFromSowing).toBeDefined();
      expect(activity.priority).toBeDefined();
      expect(activity.resources).toBeDefined();
      expect(activity.resources.length).toBeGreaterThan(0);
    });

    it('should include cost breakdown', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);
      const cost = recommendations[0].cultivationPlan.estimatedCost;

      expect(cost.min).toBeGreaterThan(0);
      expect(cost.max).toBeGreaterThanOrEqual(cost.min);
      expect(cost.breakdown).toBeDefined();
      expect(cost.breakdown.seeds).toBeGreaterThan(0);
      expect(cost.breakdown.fertilizers).toBeGreaterThan(0);
      expect(cost.breakdown.labor).toBeGreaterThan(0);
    });

    it('should include yield estimate with revenue', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);
      const yieldEst = recommendations[0].cultivationPlan.estimatedYield;

      expect(yieldEst.min).toBeGreaterThan(0);
      expect(yieldEst.max).toBeGreaterThanOrEqual(yieldEst.min);
      expect(yieldEst.unit).toBeDefined();
      expect(yieldEst.expectedRevenue).toBeDefined();
      expect(yieldEst.expectedRevenue.min).toBeGreaterThan(0);
      expect(yieldEst.expectedRevenue.max).toBeGreaterThanOrEqual(
        yieldEst.expectedRevenue.min
      );
    });

    it('should order activities by days from sowing', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);
      const activities = recommendations[0].cultivationPlan.activities;

      for (let i = 0; i < activities.length - 1; i++) {
        expect(activities[i].daysFromSowing).toBeLessThanOrEqual(
          activities[i + 1].daysFromSowing
        );
      }
    });
  });

  describe('explanation', () => {
    it('should generate meaningful explanation', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);
      const explanation = recommendations[0].explanation;

      expect(explanation).toBeDefined();
      expect(explanation.length).toBeGreaterThan(50);
      expect(explanation).toContain(recommendations[0].cropName);
    });

    it('should mention suitability in explanation', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);
      const explanation = recommendations[0].explanation;

      expect(
        explanation.includes('suitable') ||
          explanation.includes('conditions') ||
          explanation.includes('soil')
      ).toBe(true);
    });

    it('should mention season in explanation', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);
      const explanation = recommendations[0].explanation;

      expect(
        explanation.includes('kharif') ||
          explanation.includes('rabi') ||
          explanation.includes('season')
      ).toBe(true);
    });
  });

  describe('confidence', () => {
    it('should have high confidence with complete data', async () => {
      const recommendations = await recommender.generateRecommendations(mockContext);

      expect(recommendations[0].confidence).toBeGreaterThanOrEqual(90);
    });

    it('should have lower confidence with incomplete data', async () => {
      const incompleteContext = {
        ...mockContext,
        soilData: null,
        weatherForecast: null,
        computed: {
          ...mockContext.computed,
          recommendationReadiness: 50,
        },
      };

      const recommendations = await recommender.generateRecommendations(incompleteContext);

      expect(recommendations[0].confidence).toBeLessThan(90);
    });
  });

  describe('suitability calculation', () => {
    it('should score higher for matching season', () => {
      const kharifContext = { ...mockContext, currentSeason: 'kharif' as const };
      const rabiContext = { ...mockContext, currentSeason: 'rabi' as const };

      // Rice is a kharif crop
      const kharifScore = recommender['calculateSuitability'](
        recommender['cropDatabase'][0],
        kharifContext
      );
      const rabiScore = recommender['calculateSuitability'](
        recommender['cropDatabase'][0],
        rabiContext
      );

      expect(kharifScore).toBeGreaterThan(rabiScore);
    });

    it('should score higher for matching soil type', () => {
      const loamyContext = {
        ...mockContext,
        userProfile: {
          ...mockContext.userProfile,
          soilType: 'loamy',
        },
      };

      const sandyContext = {
        ...mockContext,
        userProfile: {
          ...mockContext.userProfile,
          soilType: 'sandy',
        },
      };

      // Rice prefers loamy soil
      const loamyScore = recommender['calculateSuitability'](
        recommender['cropDatabase'][0],
        loamyContext
      );
      const sandyScore = recommender['calculateSuitability'](
        recommender['cropDatabase'][0],
        sandyContext
      );

      expect(loamyScore).toBeGreaterThan(sandyScore);
    });

    it('should score higher for optimal pH', () => {
      const optimalContext = {
        ...mockContext,
        soilData: {
          ...mockSoilData,
          parameters: { ...mockSoilData.parameters, pH: 6.5 },
        },
      };

      const suboptimalContext = {
        ...mockContext,
        soilData: {
          ...mockSoilData,
          parameters: { ...mockSoilData.parameters, pH: 4.5 },
        },
      };

      // Rice prefers pH 5.5-7.0
      const optimalScore = recommender['calculateSuitability'](
        recommender['cropDatabase'][0],
        optimalContext
      );
      const suboptimalScore = recommender['calculateSuitability'](
        recommender['cropDatabase'][0],
        suboptimalContext
      );

      expect(optimalScore).toBeGreaterThan(suboptimalScore);
    });
  });
});
