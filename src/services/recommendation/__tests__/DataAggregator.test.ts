/**
 * Data Aggregator Tests
 */

import { DataAggregator } from '../DataAggregator';
import { profileApi } from '../../api/profileApi';
import { soilApi } from '../../api/soilApi';
import { weatherApi } from '../../api/weatherApi';
import { marketApi } from '../../api/marketApi';
import { UserProfile } from '../../../types/profile.types';
import { SoilHealthData } from '../../../types/soil.types';
import { WeatherForecast } from '../../../types/weather.types';
import { MarketData } from '../../../types/market.types';

jest.mock('../../api/profileApi', () => ({
  profileApi: {
    getProfile: jest.fn(),
  },
}));

jest.mock('../../api/soilApi', () => ({
  soilApi: {
    getSoilHealthByUser: jest.fn(),
  },
}));

jest.mock('../../api/weatherApi', () => ({
  weatherApi: {
    getWeatherForecast: jest.fn(),
  },
}));

jest.mock('../../api/marketApi', () => ({
  marketApi: {
    getMarketData: jest.fn(),
  },
}));

describe('DataAggregator', () => {
  let aggregator: DataAggregator;

  const mockProfile: UserProfile = {
    userId: 'user-001',
    mobileNumber: '+919876543210',
    name: 'Test Farmer',
    language: 'en',
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
    farmData: {
      size: 5,
      unit: 'hectares',
      soilType: 'loamy',
      crops: ['Rice', 'Wheat'],
      irrigationType: 'canal',
    },
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

  const mockWeatherForecast: WeatherForecast = {
    location: {
      latitude: 28.6139,
      longitude: 77.209,
      name: 'Test Location',
    },
    forecast: [],
    fetchedAt: new Date(),
  };

  const mockMarketData: MarketData = {
    cropName: 'Rice',
    currentPrice: 2000,
    unit: 'quintal',
    location: {
      latitude: 28.6139,
      longitude: 77.209,
    },
    trend: {
      direction: 'rising',
      percentageChange: 5,
      period: 30,
    },
    nearbyMandis: [],
    priceHistory: [],
    fetchedAt: new Date(),
  };

  beforeEach(() => {
    aggregator = new DataAggregator();
    jest.clearAllMocks();
  });

  describe('aggregateData', () => {
    it('should aggregate all data sources successfully', async () => {
      (profileApi.getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (soilApi.getSoilHealthByUser as jest.Mock).mockResolvedValue([mockSoilData]);
      (weatherApi.getWeatherForecast as jest.Mock).mockResolvedValue(mockWeatherForecast);
      (marketApi.getMarketData as jest.Mock).mockResolvedValue(mockMarketData);

      const context = await aggregator.aggregateData('user-001');

      expect(context.userProfile).toEqual(mockProfile);
      expect(context.soilData).toEqual(mockSoilData);
      expect(context.weatherForecast).toEqual(mockWeatherForecast);
      expect(context.marketData).toEqual(mockMarketData);
      expect(context.currentSeason).toBeDefined();
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should handle missing soil data gracefully', async () => {
      (profileApi.getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (soilApi.getSoilHealthByUser as jest.Mock).mockResolvedValue([]);
      (weatherApi.getWeatherForecast as jest.Mock).mockResolvedValue(mockWeatherForecast);
      (marketApi.getMarketData as jest.Mock).mockResolvedValue(mockMarketData);

      const context = await aggregator.aggregateData('user-001');

      expect(context.soilData).toBeNull();
      expect(context.userProfile).toEqual(mockProfile);
    });

    it('should handle missing weather data gracefully', async () => {
      (profileApi.getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (soilApi.getSoilHealthByUser as jest.Mock).mockResolvedValue([mockSoilData]);
      (weatherApi.getWeatherForecast as jest.Mock).mockRejectedValue(new Error('API Error'));
      (marketApi.getMarketData as jest.Mock).mockResolvedValue(mockMarketData);

      const context = await aggregator.aggregateData('user-001');

      expect(context.weatherForecast).toBeNull();
      expect(context.userProfile).toEqual(mockProfile);
    });

    it('should handle missing market data gracefully', async () => {
      (profileApi.getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (soilApi.getSoilHealthByUser as jest.Mock).mockResolvedValue([mockSoilData]);
      (weatherApi.getWeatherForecast as jest.Mock).mockResolvedValue(mockWeatherForecast);
      (marketApi.getMarketData as jest.Mock).mockRejectedValue(new Error('API Error'));

      const context = await aggregator.aggregateData('user-001');

      expect(context.marketData).toBeNull();
      expect(context.userProfile).toEqual(mockProfile);
    });

    it('should throw error if user profile fetch fails', async () => {
      (profileApi.getProfile as jest.Mock).mockRejectedValue(new Error('Profile not found'));

      await expect(aggregator.aggregateData('user-001')).rejects.toThrow(
        'Failed to aggregate data'
      );
    });

    it('should fetch all data in parallel', async () => {
      (profileApi.getProfile as jest.Mock).mockResolvedValue(mockProfile);
      (soilApi.getSoilHealthByUser as jest.Mock).mockResolvedValue([mockSoilData]);
      (weatherApi.getWeatherForecast as jest.Mock).mockResolvedValue(mockWeatherForecast);
      (marketApi.getMarketData as jest.Mock).mockResolvedValue(mockMarketData);

      await aggregator.aggregateData('user-001');

      // All APIs should be called
      expect(profileApi.getProfile).toHaveBeenCalledWith('user-001');
      expect(soilApi.getSoilHealthByUser).toHaveBeenCalledWith('user-001');
      expect(weatherApi.getWeatherForecast).toHaveBeenCalled();
      expect(marketApi.getMarketData).toHaveBeenCalled();
    });
  });

  describe('getCurrentSeason', () => {
    it('should return kharif for June to October', () => {
      // Test with July (month 7)
      jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(6); // July (0-indexed)
      
      const context = aggregator['getCurrentSeason']();
      expect(context).toBe('kharif');
    });

    it('should return rabi for November to March', () => {
      // Test with December (month 12)
      jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(11); // December (0-indexed)
      
      const context = aggregator['getCurrentSeason']();
      expect(context).toBe('rabi');
    });

    it('should return zaid for April to May', () => {
      // Test with April (month 4)
      jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(3); // April (0-indexed)
      
      const context = aggregator['getCurrentSeason']();
      expect(context).toBe('zaid');
    });
  });

  describe('validateContext', () => {
    it('should validate complete context as valid', () => {
      const context = {
        userProfile: mockProfile,
        soilData: mockSoilData,
        weatherForecast: mockWeatherForecast,
        marketData: mockMarketData,
        currentSeason: 'kharif' as const,
        timestamp: new Date(),
      };

      const result = aggregator.validateContext(context);

      expect(result.isValid).toBe(true);
      expect(result.missingData).toHaveLength(0);
    });

    it('should identify missing soil data', () => {
      const context = {
        userProfile: mockProfile,
        soilData: null,
        weatherForecast: mockWeatherForecast,
        marketData: mockMarketData,
        currentSeason: 'kharif' as const,
        timestamp: new Date(),
      };

      const result = aggregator.validateContext(context);

      expect(result.isValid).toBe(false);
      expect(result.missingData).toContain('Soil health data');
    });

    it('should identify missing weather data', () => {
      const context = {
        userProfile: mockProfile,
        soilData: mockSoilData,
        weatherForecast: null,
        marketData: mockMarketData,
        currentSeason: 'kharif' as const,
        timestamp: new Date(),
      };

      const result = aggregator.validateContext(context);

      expect(result.isValid).toBe(false);
      expect(result.missingData).toContain('Weather forecast');
    });

    it('should identify missing market data', () => {
      const context = {
        userProfile: mockProfile,
        soilData: mockSoilData,
        weatherForecast: mockWeatherForecast,
        marketData: null,
        currentSeason: 'kharif' as const,
        timestamp: new Date(),
      };

      const result = aggregator.validateContext(context);

      expect(result.isValid).toBe(false);
      expect(result.missingData).toContain('Market data');
    });

    it('should identify multiple missing data sources', () => {
      const context = {
        userProfile: mockProfile,
        soilData: null,
        weatherForecast: null,
        marketData: null,
        currentSeason: 'kharif' as const,
        timestamp: new Date(),
      };

      const result = aggregator.validateContext(context);

      expect(result.isValid).toBe(false);
      expect(result.missingData).toHaveLength(3);
      expect(result.missingData).toContain('Soil health data');
      expect(result.missingData).toContain('Weather forecast');
      expect(result.missingData).toContain('Market data');
    });
  });
});
