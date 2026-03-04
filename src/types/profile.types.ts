/**
 * User Profile related type definitions
 */

import { Location, UserProfile } from './index';

export interface ProfileCreateData {
  mobileNumber: string;
  name: string;
  location: Location;
  farmSize: number;
  primaryCrops: string[];
  soilType: string;
  languagePreference: string;
}

export interface ProfileUpdateData {
  name?: string;
  location?: Location;
  farmSize?: number;
  primaryCrops?: string[];
  soilType?: string;
  languagePreference?: string;
}

export interface FarmData {
  farmSize: number;
  primaryCrops: string[];
  soilType: string;
  irrigationType?: string;
  waterSource?: string;
}

export interface AlertPreferences {
  enableSMS: boolean;
  enablePushNotifications: boolean;
  quietHours: {
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
  alertTypes: {
    sowing: boolean;
    fertilizer: boolean;
    irrigation: boolean;
    pestControl: boolean;
    harvest: boolean;
    weather: boolean;
    scheme: boolean;
    marketPrice: boolean;
  };
}

export type { UserProfile, Location };
