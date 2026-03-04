/**
 * Market Price Types
 * Requirements: 8.1, 8.2, 8.6, 8.7
 */

export interface MarketPrice {
  id: string;
  crop: string;
  variety?: string;
  mandiName: string;
  mandiLocation: {
    state: string;
    district: string;
    market: string;
    latitude: number;
    longitude: number;
  };
  price: {
    min: number;
    max: number;
    modal: number; // Most common price
    currency: string;
  };
  unit: string; // e.g., "quintal", "kg"
  date: Date;
  source: string;
}

export interface PriceTrend {
  crop: string;
  variety?: string;
  prices: Array<{
    date: Date;
    price: number;
  }>;
  trend: 'rising' | 'falling' | 'stable';
  changePercent: number; // Percentage change over period
  average: number;
  period: number; // Number of days
}

export interface Mandi {
  id: string;
  name: string;
  location: {
    state: string;
    district: string;
    market: string;
    latitude: number;
    longitude: number;
  };
  distance?: number; // Distance from user in km
  contact?: {
    phone?: string;
    email?: string;
  };
  facilities: string[];
  operatingHours?: string;
}

export interface MarketData {
  prices: MarketPrice[];
  trends: PriceTrend[];
  mandis: Mandi[];
  lastUpdated: Date;
  source: string;
}

export interface PriceAlert {
  id: string;
  crop: string;
  variety?: string;
  currentPrice: number;
  averagePrice: number;
  changePercent: number;
  isFavorable: boolean; // True if price is 15% above average
  recommendation: string;
  mandiName: string;
  date: Date;
}
