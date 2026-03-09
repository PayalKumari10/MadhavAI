/**
 * Seed Recommender Service
 * Requirements: 4.1, 4.2, 4.3, 4.4
 *
 * Generates seed recommendations based on:
 * - Location and climate
 * - Soil conditions
 * - Season
 * - Yield potential and disease resistance
 */

import { FarmingContext, SeedRecommendation, SeedSource } from '../../types/recommendation.types';

interface SeedVariety {
  cropName: string;
  variety: string;
  yieldPotential: { min: number; max: number; unit: string };
  diseaseResistance: string[];
  duration: number;
  suitableSeasons: string[];
  suitableSoilTypes: string[];
  phRange: { min: number; max: number };
  waterRequirement: 'low' | 'medium' | 'high';
  seedRate: { amount: number; unit: string; perArea: string };
  sowingMonths: number[]; // 1-12
}

export class SeedRecommender {
  private seedDatabase: SeedVariety[] = [
    {
      cropName: 'Rice',
      variety: 'Pusa Basmati 1121',
      yieldPotential: { min: 4500, max: 5500, unit: 'kg/ha' },
      diseaseResistance: ['Bacterial Blight', 'Blast'],
      duration: 140,
      suitableSeasons: ['kharif'],
      suitableSoilTypes: ['clay', 'loam'],
      phRange: { min: 5.5, max: 7.0 },
      waterRequirement: 'high',
      seedRate: { amount: 20, unit: 'kg', perArea: 'hectare' },
      sowingMonths: [6, 7], // June-July
    },
    {
      cropName: 'Rice',
      variety: 'IR64',
      yieldPotential: { min: 5000, max: 6000, unit: 'kg/ha' },
      diseaseResistance: ['Brown Planthopper', 'Bacterial Blight'],
      duration: 120,
      suitableSeasons: ['kharif'],
      suitableSoilTypes: ['clay', 'loam'],
      phRange: { min: 5.5, max: 7.0 },
      waterRequirement: 'high',
      seedRate: { amount: 25, unit: 'kg', perArea: 'hectare' },
      sowingMonths: [6, 7, 8], // June-August
    },
    {
      cropName: 'Wheat',
      variety: 'HD 2967',
      yieldPotential: { min: 5000, max: 6000, unit: 'kg/ha' },
      diseaseResistance: ['Rust', 'Powdery Mildew'],
      duration: 140,
      suitableSeasons: ['rabi'],
      suitableSoilTypes: ['loam', 'clay'],
      phRange: { min: 6.0, max: 7.5 },
      waterRequirement: 'medium',
      seedRate: { amount: 100, unit: 'kg', perArea: 'hectare' },
      sowingMonths: [11, 12], // November-December
    },
    {
      cropName: 'Wheat',
      variety: 'PBW 343',
      yieldPotential: { min: 4500, max: 5500, unit: 'kg/ha' },
      diseaseResistance: ['Leaf Rust', 'Brown Rust'],
      duration: 135,
      suitableSeasons: ['rabi'],
      suitableSoilTypes: ['loam', 'sandy loam'],
      phRange: { min: 6.0, max: 7.5 },
      waterRequirement: 'medium',
      seedRate: { amount: 100, unit: 'kg', perArea: 'hectare' },
      sowingMonths: [11, 12], // November-December
    },
    {
      cropName: 'Cotton',
      variety: 'Bt Cotton Hybrid',
      yieldPotential: { min: 2500, max: 3500, unit: 'kg/ha' },
      diseaseResistance: ['Bollworm', 'Leaf Curl Virus'],
      duration: 180,
      suitableSeasons: ['kharif'],
      suitableSoilTypes: ['black', 'loam'],
      phRange: { min: 6.0, max: 8.0 },
      waterRequirement: 'medium',
      seedRate: { amount: 1.5, unit: 'kg', perArea: 'hectare' },
      sowingMonths: [5, 6], // May-June
    },
    {
      cropName: 'Maize',
      variety: 'DHM 117',
      yieldPotential: { min: 6000, max: 7000, unit: 'kg/ha' },
      diseaseResistance: ['Turcicum Leaf Blight', 'Maydis Leaf Blight'],
      duration: 90,
      suitableSeasons: ['kharif', 'rabi'],
      suitableSoilTypes: ['loam', 'sandy loam'],
      phRange: { min: 5.5, max: 7.5 },
      waterRequirement: 'medium',
      seedRate: { amount: 20, unit: 'kg', perArea: 'hectare' },
      sowingMonths: [6, 7, 11, 12], // June-July, November-December
    },
    {
      cropName: 'Sugarcane',
      variety: 'Co 0238',
      yieldPotential: { min: 80000, max: 100000, unit: 'kg/ha' },
      diseaseResistance: ['Red Rot', 'Smut'],
      duration: 365,
      suitableSeasons: ['kharif', 'rabi'],
      suitableSoilTypes: ['loam', 'clay'],
      phRange: { min: 6.0, max: 7.5 },
      waterRequirement: 'high',
      seedRate: { amount: 40000, unit: 'setts', perArea: 'hectare' },
      sowingMonths: [2, 3, 9, 10], // February-March, September-October
    },
  ];

  /**
   * Generate seed recommendations based on farming context
   * Requirements: 4.1, 4.2, 4.3, 4.4
   */
  async generateRecommendations(
    context: FarmingContext,
    cropName?: string
  ): Promise<SeedRecommendation[]> {
    // Filter varieties by crop if specified
    let varieties = cropName
      ? this.seedDatabase.filter((v) => v.cropName === cropName)
      : this.seedDatabase;

    // Filter by season
    varieties = varieties.filter((v) => v.suitableSeasons.includes(context.currentSeason));

    // Score and rank varieties
    const scoredVarieties = varieties.map((variety) => ({
      variety,
      score: this.calculateVarietyScore(variety, context),
    }));

    // Sort by score descending
    scoredVarieties.sort((a, b) => b.score - a.score);

    // Generate recommendations for top varieties
    const recommendations: SeedRecommendation[] = [];
    for (const { variety, score } of scoredVarieties.slice(0, 5)) {
      const recommendation = await this.createRecommendation(variety, context, score);
      recommendations.push(recommendation);
    }

    return recommendations;
  }

  /**
   * Calculate variety suitability score
   */
  private calculateVarietyScore(variety: SeedVariety, context: FarmingContext): number {
    let score = 0;

    // Soil type match (30 points)
    if (context.soilData) {
      const soilType = context.soilData.soilType.toLowerCase();
      if (variety.suitableSoilTypes.some((st) => soilType.includes(st))) {
        score += 30;
      }
    }

    // pH range match (20 points)
    if (context.soilData) {
      const ph = context.soilData.parameters.pH;
      if (ph >= variety.phRange.min && ph <= variety.phRange.max) {
        score += 20;
      } else {
        // Partial score for close pH
        const phDiff = Math.min(
          Math.abs(ph - variety.phRange.min),
          Math.abs(ph - variety.phRange.max)
        );
        score += Math.max(0, 20 - phDiff * 5);
      }
    }

    // Yield potential (25 points)
    const avgYield = (variety.yieldPotential.min + variety.yieldPotential.max) / 2;
    const normalizedYield = avgYield / 10000; // Normalize to 0-1 range
    score += Math.min(25, normalizedYield * 25);

    // Disease resistance (15 points)
    score += Math.min(15, variety.diseaseResistance.length * 5);

    // Duration (10 points - shorter is better for faster returns)
    const durationScore = Math.max(0, 10 - (variety.duration / 365) * 10);
    score += durationScore;

    return score;
  }

  /**
   * Create seed recommendation from variety
   */
  private async createRecommendation(
    variety: SeedVariety,
    context: FarmingContext,
    score: number
  ): Promise<SeedRecommendation> {
    const sowingWindow = this.calculateSowingWindow(variety, context);
    const sources = this.getSeedSources(variety, context);
    const explanation = this.generateExplanation(variety, context, score);
    const confidence = this.calculateConfidence(context);

    return {
      cropName: variety.cropName,
      variety: variety.variety,
      yieldPotential: variety.yieldPotential,
      diseaseResistance: variety.diseaseResistance,
      duration: variety.duration,
      sowingWindow,
      seedRate: variety.seedRate,
      sources,
      explanation,
      confidence,
    };
  }

  /**
   * Calculate optimal sowing window
   * Requirements: 4.3
   */
  private calculateSowingWindow(
    variety: SeedVariety,
    context: FarmingContext
  ): { start: Date; end: Date } {
    const currentDate = new Date(context.timestamp);
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();

    // Find next sowing month
    let nextSowingMonth = variety.sowingMonths.find((m) => m >= currentMonth);
    let sowingYear = currentYear;

    if (!nextSowingMonth) {
      // Use first month of next year
      nextSowingMonth = variety.sowingMonths[0];
      sowingYear = currentYear + 1;
    }

    // Sowing window is the entire month
    const start = new Date(sowingYear, nextSowingMonth - 1, 1);
    const end = new Date(sowingYear, nextSowingMonth, 0); // Last day of month

    return { start, end };
  }

  /**
   * Get trusted seed sources
   * Requirements: 4.4
   */
  private getSeedSources(_variety: SeedVariety, context: FarmingContext): SeedSource[] {
    const sources: SeedSource[] = [];

    // Government seed source
    sources.push({
      name: 'State Agriculture Department',
      type: 'government',
      location: context.userProfile.location.state,
      contact: '1800-180-1551',
      certified: true,
      price: { min: 50, max: 100, unit: 'per kg' },
    });

    // Cooperative source
    sources.push({
      name: 'District Cooperative Society',
      type: 'cooperative',
      location: context.userProfile.location.district,
      contact: 'Contact local cooperative',
      certified: true,
      price: { min: 60, max: 120, unit: 'per kg' },
    });

    // Private source
    sources.push({
      name: 'Certified Seed Dealer',
      type: 'private',
      location: context.userProfile.location.district,
      contact: 'Visit nearest dealer',
      certified: true,
      price: { min: 80, max: 150, unit: 'per kg' },
    });

    return sources;
  }

  /**
   * Generate explanation for recommendation
   */
  private generateExplanation(
    variety: SeedVariety,
    context: FarmingContext,
    _score: number
  ): string {
    const reasons: string[] = [];

    // Season match
    reasons.push(`Suitable for ${context.currentSeason} season`);

    // Soil compatibility
    if (context.soilData) {
      const soilType = context.soilData.soilType.toLowerCase();
      if (variety.suitableSoilTypes.some((st) => soilType.includes(st))) {
        reasons.push(`Compatible with ${context.soilData.soilType} soil`);
      }
    }

    // Yield potential
    reasons.push(
      `High yield potential of ${variety.yieldPotential.min}-${variety.yieldPotential.max} ${variety.yieldPotential.unit}`
    );

    // Disease resistance
    if (variety.diseaseResistance.length > 0) {
      reasons.push(
        `Resistant to ${variety.diseaseResistance.slice(0, 2).join(', ')}${
          variety.diseaseResistance.length > 2 ? ' and more' : ''
        }`
      );
    }

    // Duration
    reasons.push(`Matures in ${variety.duration} days`);

    return reasons.join('. ') + '.';
  }

  /**
   * Calculate confidence score based on data completeness
   */
  private calculateConfidence(context: FarmingContext): number {
    let confidence = 0;

    // Base confidence
    confidence += 40;

    // Soil data available
    if (context.soilData) {
      confidence += 30;
    }

    // Weather data available
    if (context.weatherForecast) {
      confidence += 15;
    }

    // Market data available
    if (context.marketData) {
      confidence += 15;
    }

    return confidence;
  }
}
