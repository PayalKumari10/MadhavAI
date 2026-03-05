/**
 * Recommendation Types
 * Requirements: 16.1, 7.1, 3.1, 4.1
 */

import { UserProfile } from './profile.types';
import { SoilHealthData } from './soil.types';
import { WeatherForecast } from './weather.types';
import { MarketData } from './market.types';

/**
 * Farming context aggregating all data sources
 */
export interface FarmingContext {
  userProfile: UserProfile;
  soilData: SoilHealthData | null;
  weatherForecast: WeatherForecast | null;
  marketData: MarketData | null;
  currentSeason: Season;
  timestamp: Date;
}

/**
 * Season information
 */
export type Season = 'kharif' | 'rabi' | 'zaid';

/**
 * Crop recommendation
 */
export interface CropRecommendation {
  cropName: string;
  suitabilityScore: number;
  profitabilityScore: number;
  riskScore: number;
  overallScore: number;
  cultivationPlan: CultivationPlan;
  explanation: string;
  confidence: number;
}

/**
 * Cultivation plan with activities
 */
export interface CultivationPlan {
  cropName: string;
  duration: number; // days
  activities: CropActivity[];
  estimatedCost: CostEstimate;
  estimatedYield: YieldEstimate;
}

/**
 * Crop activity
 */
export interface CropActivity {
  id: string;
  name: string;
  description: string;
  timing: string;
  daysFromSowing: number;
  priority: 'high' | 'medium' | 'low';
  resources: string[];
}

/**
 * Cost estimate
 */
export interface CostEstimate {
  min: number;
  max: number;
  breakdown: {
    seeds: number;
    fertilizers: number;
    pesticides: number;
    labor: number;
    irrigation: number;
    other: number;
  };
}

/**
 * Yield estimate
 */
export interface YieldEstimate {
  min: number;
  max: number;
  unit: string;
  expectedRevenue: {
    min: number;
    max: number;
  };
}

/**
 * Fertilizer recommendation
 */
export interface FertilizerRecommendation {
  nutrient: string;
  type: 'organic' | 'chemical';
  name: string;
  dosage: {
    amount: number;
    unit: string;
    perArea: string;
  };
  applicationTiming: string;
  applicationMethod: string;
  cost: {
    min: number;
    max: number;
  };
  alternatives: FertilizerAlternative[];
  explanation: string;
  confidence: number;
}

/**
 * Fertilizer alternative
 */
export interface FertilizerAlternative {
  name: string;
  type: 'organic' | 'chemical';
  dosage: {
    amount: number;
    unit: string;
    perArea: string;
  };
  cost: {
    min: number;
    max: number;
  };
  effectiveness: number;
}

/**
 * Seed recommendation
 */
export interface SeedRecommendation {
  cropName: string;
  variety: string;
  yieldPotential: {
    min: number;
    max: number;
    unit: string;
  };
  diseaseResistance: string[];
  duration: number; // days
  sowingWindow: {
    start: Date;
    end: Date;
  };
  seedRate: {
    amount: number;
    unit: string;
    perArea: string;
  };
  sources: SeedSource[];
  explanation: string;
  confidence: number;
}

/**
 * Seed source
 */
export interface SeedSource {
  name: string;
  type: 'government' | 'private' | 'cooperative';
  location: string;
  contact: string;
  certified: boolean;
  price: {
    min: number;
    max: number;
    unit: string;
  };
}

/**
 * Recommendation explanation
 */
export interface RecommendationExplanation {
  summary: string;
  factors: ExplanationFactor[];
  confidence: number;
  reasoning: string;
}

/**
 * Explanation factor
 */
export interface ExplanationFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

/**
 * User feedback on recommendation
 */
export interface RecommendationFeedback {
  id: string;
  userId: string;
  recommendationType: 'crop' | 'fertilizer' | 'seed';
  recommendationId: string;
  action: 'accepted' | 'rejected' | 'modified';
  modifications?: Record<string, any>;
  reason?: string;
  timestamp: Date;
}
