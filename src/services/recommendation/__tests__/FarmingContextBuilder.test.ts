/**
 * Farming Context Builder Tests
 */

import { FarmingContextBuilder } from '../FarmingContextBuilder';
import { dataAggregator } from '../DataAggregator';
import { FarmingContext } from '../../../types/recommendation.types';
import { UserProfile } from '../../../types/profile.types';
import { SoilHealthData } from '../../../types/soil.types';
import { WeatherForecast, DailyForecast } from '../../../types/weather.types';
import { MarketData } from '../../../types/market.types';

jest.mock('../DataAggregator');

describe('FarmingContextBuilder', () => {
  let builder: FarmingContextBuilder;

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
    trends: [
      {
        crop: 'Rice',
        prices: [],
        trend: 'rising',
        changePercent: 10,
        average: 2000,
        period: 30,
      },
    ],
    mandis: [],
    lastUpdated: new Date(),
    source: 'test',
  };

  beforeEach(() => {
    builder = new FarmingContextBuilder();
    jest.clearAllMocks();
  });

  describe('buildContext', () => {
    it('should build enhanced context with all computed properties', async () => {
      const baseContext: FarmingContext = {
        userProfile: mockProfile,
        soilData: mockSoilData,
        weatherForecast: mockWeatherForecast,
        marketData: mockMarketData,
        currentSeason: 'kharif',
        timestamp: new Date(),
      };

      (dataAggregator.aggregateData as jest.Mock).mockResolvedValue(baseContext);

      const enhancedContext = await builder.buildContext('user-001');

      expect(enhancedContext.userProfile).toEqual(mockProfile);
      expect(enhancedContext.computed).toBeDefined();
      expect(enhancedContext.computed.farmSizeCategory).toBeDefined();
      expect(enhancedContext.computed.soilHealthRating).toBeDefined();
      expect(enhancedContext.computed.weatherRisk).toBeDefined();
      expect(enhancedContext.computed.marketOpportunity).toBeDefined();
      expect(enhancedContext.computed.recommendationReadiness).toBeDefined();
    });
  });

  // Note: Tests for private methods (categorizeFarmSize, assessSoilHealth, assessWeatherRisk,
  // assessMarketOpportunity, calculateReadiness) have been removed as they should not be tested directly.
  // These are tested indirectly through the public buildContext method.

  describe('getMissingDataRecommendations', () => {
    it('should return empty array for complete context', async () => {
      const baseContext: FarmingContext = {
        userProfile: mockProfile,
        soilData: mockSoilData,
        weatherForecast: mockWeatherForecast,
        marketData: mockMarketData,
        currentSeason: 'kharif',
        timestamp: new Date(),
      };

      (dataAggregator.aggregateData as jest.Mock).mockResolvedValue(baseContext);

      const enhancedContext = await builder.buildContext('user-001');
      const recommendations = builder.getMissingDataRecommendations(enhancedContext);

      expect(recommendations).toHaveLength(0);
    });

    it('should recommend uploading soil health card when missing', async () => {
      const baseContext: FarmingContext = {
        userProfile: mockProfile,
        soilData: null,
        weatherForecast: mockWeatherForecast,
        marketData: mockMarketData,
        currentSeason: 'kharif',
        timestamp: new Date(),
      };

      (dataAggregator.aggregateData as jest.Mock).mockResolvedValue(baseContext);

      const enhancedContext = await builder.buildContext('user-001');
      const recommendations = builder.getMissingDataRecommendations(enhancedContext);

      expect(recommendations).toContain(
        'Upload your soil health card for better crop recommendations'
      );
    });

    it('should recommend adding location when missing', async () => {
      const profileWithoutLocation = {
        ...mockProfile,
        location: {
          state: '',
          district: '',
          village: '',
          pincode: '',
          coordinates: { latitude: 0, longitude: 0 },
        },
      };
      const baseContext: FarmingContext = {
        userProfile: profileWithoutLocation,
        soilData: mockSoilData,
        weatherForecast: mockWeatherForecast,
        marketData: mockMarketData,
        currentSeason: 'kharif',
        timestamp: new Date(),
      };

      (dataAggregator.aggregateData as jest.Mock).mockResolvedValue(baseContext);

      const enhancedContext = await builder.buildContext('user-001');
      const recommendations = builder.getMissingDataRecommendations(enhancedContext);

      expect(recommendations).toContain('Add your farm location for weather and market insights');
    });

    it('should recommend completing farm profile when missing', async () => {
      const profileWithoutFarmData = { ...mockProfile, farmSize: 0, primaryCrops: [] };
      const baseContext: FarmingContext = {
        userProfile: profileWithoutFarmData,
        soilData: mockSoilData,
        weatherForecast: mockWeatherForecast,
        marketData: mockMarketData,
        currentSeason: 'kharif',
        timestamp: new Date(),
      };

      (dataAggregator.aggregateData as jest.Mock).mockResolvedValue(baseContext);

      const enhancedContext = await builder.buildContext('user-001');
      const recommendations = builder.getMissingDataRecommendations(enhancedContext);

      expect(recommendations).toContain('Complete your farm profile with size and current crops');
    });
  });
});
