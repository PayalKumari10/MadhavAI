/**
 * Unit tests for Market Price Display Component
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { MarketPriceDisplay } from '../MarketPriceDisplay';
import { marketService } from '../../services/market/MarketService';

// Mock market service
jest.mock('../../services/market/MarketService');

describe('MarketPriceDisplay', () => {
  const mockPrices = [
    {
      id: 'price_1',
      crop: 'Wheat',
      mandiName: 'Central Mandi',
      mandiLocation: {
        state: 'Karnataka',
        district: 'Bangalore',
        market: 'Central Mandi',
        latitude: 12.9716,
        longitude: 77.5946,
      },
      price: {
        min: 1800,
        max: 2200,
        modal: 2000,
        currency: 'INR',
      },
      unit: 'quintal',
      date: new Date(),
      source: 'Test',
    },
  ];

  const mockMandis = [
    {
      id: 'mandi_1',
      name: 'Central Mandi',
      location: {
        state: 'Karnataka',
        district: 'Bangalore',
        market: 'Central Mandi',
        latitude: 12.9716,
        longitude: 77.5946,
      },
      distance: 5.2,
      facilities: ['Storage', 'Weighing'],
      operatingHours: '6:00 AM - 6:00 PM',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (marketService.getPrices as jest.Mock).mockResolvedValue(mockPrices);
    (marketService.getNearbyMandis as jest.Mock).mockResolvedValue(mockMandis);
  });

  it('should render loading state initially', () => {
    const { getByText } = render(<MarketPriceDisplay latitude={12.9716} longitude={77.5946} />);

    expect(getByText('Loading market prices...')).toBeTruthy();
  });

  it('should render market data after loading', async () => {
    const { getByText } = render(<MarketPriceDisplay latitude={12.9716} longitude={77.5946} />);

    await waitFor(() => {
      expect(getByText('Select Crop')).toBeTruthy();
    });
  });

  it('should display crop selector', async () => {
    const { getByText } = render(<MarketPriceDisplay latitude={12.9716} longitude={77.5946} />);

    await waitFor(() => {
      expect(getByText('Wheat')).toBeTruthy();
    });
  });

  it('should display current prices', async () => {
    const { getByText, getAllByText } = render(
      <MarketPriceDisplay latitude={12.9716} longitude={77.5946} />
    );

    await waitFor(() => {
      expect(getByText('Current Prices')).toBeTruthy();
      expect(getAllByText('Central Mandi').length).toBeGreaterThan(0);
    });
  });

  it('should display nearby mandis', async () => {
    const { getByText } = render(<MarketPriceDisplay latitude={12.9716} longitude={77.5946} />);

    await waitFor(() => {
      expect(getByText('Nearby Mandis')).toBeTruthy();
    });
  });

  it('should display error message on failure', async () => {
    (marketService.getPrices as jest.Mock).mockRejectedValue(new Error('API Error'));

    const { getByText } = render(<MarketPriceDisplay latitude={12.9716} longitude={77.5946} />);

    await waitFor(() => {
      expect(getByText('Failed to load market data')).toBeTruthy();
    });
  });

  it('should display no data message when prices are empty', async () => {
    (marketService.getPrices as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<MarketPriceDisplay latitude={12.9716} longitude={77.5946} />);

    await waitFor(() => {
      expect(getByText('No market data available')).toBeTruthy();
    });
  });

  it('should filter prices by crop', async () => {
    const multiCropPrices = [
      ...mockPrices,
      {
        ...mockPrices[0],
        id: 'price_2',
        crop: 'Rice',
      },
    ];

    (marketService.getPrices as jest.Mock).mockResolvedValue(multiCropPrices);

    const { getByText } = render(<MarketPriceDisplay latitude={12.9716} longitude={77.5946} />);

    await waitFor(() => {
      expect(getByText('Wheat')).toBeTruthy();
      expect(getByText('Rice')).toBeTruthy();
    });
  });

  it('should display mandi facilities', async () => {
    const { getByText } = render(<MarketPriceDisplay latitude={12.9716} longitude={77.5946} />);

    await waitFor(() => {
      expect(getByText('Storage')).toBeTruthy();
      expect(getByText('Weighing')).toBeTruthy();
    });
  });

  it('should display mandi distance', async () => {
    const { getByText } = render(<MarketPriceDisplay latitude={12.9716} longitude={77.5946} />);

    await waitFor(() => {
      expect(getByText('5.2 km')).toBeTruthy();
    });
  });
});
