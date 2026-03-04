/**
 * Weather-related type definitions
 * Requirements: 6.1, 6.2, 6.3, 6.5, 6.6
 */

export type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'rain'
  | 'heavy_rain'
  | 'thunderstorm'
  | 'drizzle'
  | 'fog'
  | 'snow'
  | 'hail';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'severe';

export interface Temperature {
  current: number; // Celsius
  min: number;
  max: number;
  feelsLike: number;
}

export interface Wind {
  speed: number; // km/h
  direction: string; // N, NE, E, SE, S, SW, W, NW
  gust?: number;
}

export interface Precipitation {
  probability: number; // percentage (0-100)
  amount: number; // mm
  type: 'rain' | 'snow' | 'hail' | 'none';
}

export interface DailyForecast {
  date: Date;
  condition: WeatherCondition;
  temperature: Temperature;
  humidity: number; // percentage (0-100)
  wind: Wind;
  precipitation: Precipitation;
  uvIndex: number;
  sunrise: Date;
  sunset: Date;
  description: string;
}

export interface WeatherAlert {
  id: string;
  type: 'heavy_rain' | 'thunderstorm' | 'hail' | 'heat_wave' | 'cold_wave' | 'fog' | 'wind';
  severity: AlertSeverity;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  affectedAreas: string[];
  farmingAdvice: string;
}

export interface WeatherForecast {
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  current: DailyForecast;
  daily: DailyForecast[]; // 7-day forecast
  alerts: WeatherAlert[];
  lastUpdated: Date;
  source: string;
}

export interface WeatherCache {
  forecast: WeatherForecast;
  cachedAt: Date;
  expiresAt: Date;
}

export interface FarmingAdvice {
  condition: WeatherCondition;
  advice: string[];
  doActivities: string[];
  avoidActivities: string[];
  priority: 'low' | 'medium' | 'high';
}
