/**
 * User Profile related type definitions
 */

// Location interface (used by UserProfile)
export interface Location {
  state: string;
  district: string;
  village: string;
  pincode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

// UserProfile interface
export interface UserProfile {
  userId: string;
  mobileNumber: string;
  name: string;
  location: Location;
  farmSize: number; // in acres
  primaryCrops: string[];
  soilType: string;
  languagePreference: string;
  createdAt: Date;
  updatedAt: Date;
}

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
