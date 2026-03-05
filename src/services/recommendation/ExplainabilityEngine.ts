/**
 * Explainability Engine
 * Generates clear, simple explanations for all recommendations
 * Requirements: 3.5, 4.5, 6.7, 7.5, 10.5, 16.5
 */

import { RecommendationExplanation, ExplanationFactor } from '../../types/recommendation.types';
import { EnhancedFarmingContext } from './FarmingContextBuilder';

/**
 * Recommendation type for explanation generation
 */
export type RecommendationType = 'crop' | 'fertilizer' | 'seed' | 'soil' | 'weather';

/**
 * Input data for generating explanations
 */
export interface ExplanationInput {
  type: RecommendationType;
  recommendationName: string;
  scores?: {
    suitability?: number;
    profitability?: number;
    risk?: number;
    overall?: number;
  };
  context: EnhancedFarmingContext;
  additionalFactors?: Record<string, any>;
}

/**
 * Explainability Engine
 * Generates clear, jargon-free explanations for recommendations
 */
export class ExplainabilityEngine {
  /**
   * Generate explanation for any recommendation
   */
  generateExplanation(input: ExplanationInput): RecommendationExplanation {
    const factors = this.identifyFactors(input);
    const confidence = this.calculateConfidence(input.context, factors);
    const reasoning = this.generateReasoning(input, factors);
    const summary = this.generateSummary(input, factors);

    return {
      summary,
      factors,
      confidence,
      reasoning,
    };
  }

  /**
   * Identify and analyze factors affecting the recommendation
   */
  private identifyFactors(input: ExplanationInput): ExplanationFactor[] {
    const factors: ExplanationFactor[] = [];

    switch (input.type) {
      case 'crop':
        factors.push(...this.getCropFactors(input));
        break;
      case 'fertilizer':
        factors.push(...this.getFertilizerFactors(input));
        break;
      case 'seed':
        factors.push(...this.getSeedFactors(input));
        break;
      case 'soil':
        factors.push(...this.getSoilFactors(input));
        break;
      case 'weather':
        factors.push(...this.getWeatherFactors(input));
        break;
    }

    // Sort by weight (most important first)
    factors.sort((a, b) => b.weight - a.weight);

    return factors;
  }

  /**
   * Get factors for crop recommendations
   */
  private getCropFactors(input: ExplanationInput): ExplanationFactor[] {
    const factors: ExplanationFactor[] = [];
    const { context } = input;
    // scores could be used for more detailed factor analysis in the future

    // Season factor
    factors.push({
      name: 'Season',
      impact: 'positive',
      weight: 0.25,
      description: `Current ${context.currentSeason} season is suitable for this crop`,
    });

    // Soil suitability
    if (context.soilData) {
      const soilHealth = context.computed.soilHealthRating;
      factors.push({
        name: 'Soil Condition',
        impact: soilHealth === 'good' || soilHealth === 'excellent' ? 'positive' : 
                soilHealth === 'poor' ? 'negative' : 'neutral',
        weight: 0.25,
        description: `Your soil is in ${soilHealth} condition for this crop`,
      });
    }

    // Weather conditions
    if (context.weatherForecast) {
      const weatherRisk = context.computed.weatherRisk;
      factors.push({
        name: 'Weather',
        impact: weatherRisk === 'low' ? 'positive' : 
                weatherRisk === 'high' ? 'negative' : 'neutral',
        weight: 0.20,
        description: weatherRisk === 'low' 
          ? 'Weather conditions are favorable'
          : weatherRisk === 'high'
          ? 'Weather conditions need careful monitoring'
          : 'Weather conditions are moderate',
      });
    }

    // Market opportunity
    if (context.marketData) {
      const marketOpp = context.computed.marketOpportunity;
      factors.push({
        name: 'Market Price',
        impact: marketOpp === 'favorable' ? 'positive' : 
                marketOpp === 'unfavorable' ? 'negative' : 'neutral',
        weight: 0.20,
        description: marketOpp === 'favorable'
          ? 'Current market prices are good'
          : marketOpp === 'unfavorable'
          ? 'Market prices are currently low'
          : 'Market prices are stable',
      });
    }

    // Farm size consideration
    const farmSize = context.computed.farmSizeCategory;
    factors.push({
      name: 'Farm Size',
      impact: 'neutral',
      weight: 0.10,
      description: `Suitable for ${farmSize} farms like yours`,
    });

    return factors;
  }

  /**
   * Get factors for fertilizer recommendations
   */
  private getFertilizerFactors(input: ExplanationInput): ExplanationFactor[] {
    const factors: ExplanationFactor[] = [];
    const { context } = input;

    if (!context.soilData) {
      factors.push({
        name: 'General Recommendation',
        impact: 'neutral',
        weight: 0.5,
        description: 'Based on typical crop needs',
      });
      return factors;
    }

    const { parameters } = context.soilData;

    // Nitrogen level
    if (parameters.nitrogen < 280) {
      factors.push({
        name: 'Nitrogen Level',
        impact: 'negative',
        weight: 0.35,
        description: `Your soil has low nitrogen (${Math.round(parameters.nitrogen)} kg/ha). Plants need nitrogen for healthy leaf growth`,
      });
    } else if (parameters.nitrogen > 400) {
      factors.push({
        name: 'Nitrogen Level',
        impact: 'positive',
        weight: 0.35,
        description: `Your soil has good nitrogen (${Math.round(parameters.nitrogen)} kg/ha). Use fertilizer carefully to avoid excess`,
      });
    }

    // Phosphorus level
    if (parameters.phosphorus < 25) {
      factors.push({
        name: 'Phosphorus Level',
        impact: 'negative',
        weight: 0.30,
        description: `Your soil has low phosphorus (${Math.round(parameters.phosphorus)} kg/ha). Plants need phosphorus for strong roots`,
      });
    } else if (parameters.phosphorus > 50) {
      factors.push({
        name: 'Phosphorus Level',
        impact: 'positive',
        weight: 0.30,
        description: `Your soil has good phosphorus (${Math.round(parameters.phosphorus)} kg/ha)`,
      });
    }

    // Potassium level
    if (parameters.potassium < 280) {
      factors.push({
        name: 'Potassium Level',
        impact: 'negative',
        weight: 0.25,
        description: `Your soil has low potassium (${Math.round(parameters.potassium)} kg/ha). Plants need potassium for disease resistance`,
      });
    } else if (parameters.potassium > 400) {
      factors.push({
        name: 'Potassium Level',
        impact: 'positive',
        weight: 0.25,
        description: `Your soil has good potassium (${Math.round(parameters.potassium)} kg/ha)`,
      });
    }

    // Organic carbon
    if (parameters.organicCarbon < 0.5) {
      factors.push({
        name: 'Soil Health',
        impact: 'negative',
        weight: 0.10,
        description: 'Your soil needs more organic matter. Consider using compost or manure',
      });
    }

    return factors;
  }

  /**
   * Get factors for seed recommendations
   */
  private getSeedFactors(input: ExplanationInput): ExplanationFactor[] {
    const factors: ExplanationFactor[] = [];
    const { context } = input;

    // Season timing
    factors.push({
      name: 'Planting Season',
      impact: 'positive',
      weight: 0.30,
      description: `Right time to plant for ${context.currentSeason} season`,
    });

    // Soil suitability
    if (context.soilData) {
      const soilHealth = context.computed.soilHealthRating;
      factors.push({
        name: 'Soil Match',
        impact: soilHealth === 'good' || soilHealth === 'excellent' ? 'positive' : 'neutral',
        weight: 0.25,
        description: `This seed variety grows well in your soil type`,
      });
    }

    // Disease resistance
    factors.push({
      name: 'Disease Protection',
      impact: 'positive',
      weight: 0.25,
      description: 'This variety has good resistance to common diseases',
    });

    // Yield potential
    factors.push({
      name: 'Expected Yield',
      impact: 'positive',
      weight: 0.20,
      description: 'Good yield potential for your area',
    });

    return factors;
  }

  /**
   * Get factors for soil recommendations
   */
  private getSoilFactors(input: ExplanationInput): ExplanationFactor[] {
    const factors: ExplanationFactor[] = [];
    const { context } = input;

    if (!context.soilData) {
      return factors;
    }

    const { parameters } = context.soilData;

    // pH level
    if (parameters.pH < 6.0) {
      factors.push({
        name: 'Soil Acidity',
        impact: 'negative',
        weight: 0.30,
        description: `Your soil is acidic (pH ${parameters.pH.toFixed(1)}). Add lime to reduce acidity`,
      });
    } else if (parameters.pH > 8.0) {
      factors.push({
        name: 'Soil Alkalinity',
        impact: 'negative',
        weight: 0.30,
        description: `Your soil is alkaline (pH ${parameters.pH.toFixed(1)}). Add organic matter to balance`,
      });
    } else {
      factors.push({
        name: 'Soil pH',
        impact: 'positive',
        weight: 0.30,
        description: `Your soil pH (${parameters.pH.toFixed(1)}) is good for most crops`,
      });
    }

    // Nutrient status
    const nutrientIssues = [];
    if (parameters.nitrogen < 280) nutrientIssues.push('nitrogen');
    if (parameters.phosphorus < 25) nutrientIssues.push('phosphorus');
    if (parameters.potassium < 280) nutrientIssues.push('potassium');

    if (nutrientIssues.length > 0) {
      factors.push({
        name: 'Nutrient Levels',
        impact: 'negative',
        weight: 0.40,
        description: `Your soil needs more ${nutrientIssues.join(', ')}`,
      });
    } else {
      factors.push({
        name: 'Nutrient Levels',
        impact: 'positive',
        weight: 0.40,
        description: 'Your soil has good nutrient levels',
      });
    }

    // Organic matter
    if (parameters.organicCarbon < 0.5) {
      factors.push({
        name: 'Organic Matter',
        impact: 'negative',
        weight: 0.30,
        description: 'Your soil needs more organic matter. Add compost or farmyard manure',
      });
    } else {
      factors.push({
        name: 'Organic Matter',
        impact: 'positive',
        weight: 0.30,
        description: 'Your soil has good organic matter content',
      });
    }

    return factors;
  }

  /**
   * Get factors for weather-based recommendations
   */
  private getWeatherFactors(input: ExplanationInput): ExplanationFactor[] {
    const factors: ExplanationFactor[] = [];
    const { context } = input;

    if (!context.weatherForecast) {
      return factors;
    }

    const forecast = context.weatherForecast.daily[0]; // Today's forecast

    // Rainfall
    if (forecast.precipitation.amount > 50) {
      factors.push({
        name: 'Heavy Rain Expected',
        impact: 'negative',
        weight: 0.40,
        description: `Heavy rain (${Math.round(forecast.precipitation.amount)}mm) expected. Delay field work`,
      });
    } else if (forecast.precipitation.amount > 10) {
      factors.push({
        name: 'Rain Expected',
        impact: 'neutral',
        weight: 0.30,
        description: `Light rain (${Math.round(forecast.precipitation.amount)}mm) expected. Plan accordingly`,
      });
    } else {
      factors.push({
        name: 'Dry Weather',
        impact: 'positive',
        weight: 0.30,
        description: 'Good weather for field activities',
      });
    }

    // Temperature
    if (forecast.temperature.max > 40) {
      factors.push({
        name: 'High Temperature',
        impact: 'negative',
        weight: 0.30,
        description: `Very hot (${Math.round(forecast.temperature.max)}°C). Ensure adequate irrigation`,
      });
    } else if (forecast.temperature.min < 10) {
      factors.push({
        name: 'Low Temperature',
        impact: 'negative',
        weight: 0.30,
        description: `Cold weather (${Math.round(forecast.temperature.min)}°C). Protect sensitive crops`,
      });
    }

    // Humidity
    if (forecast.humidity > 80) {
      factors.push({
        name: 'High Humidity',
        impact: 'negative',
        weight: 0.20,
        description: 'High humidity increases disease risk. Monitor crops closely',
      });
    }

    // Wind
    if (forecast.wind.speed > 30) {
      factors.push({
        name: 'Strong Wind',
        impact: 'negative',
        weight: 0.20,
        description: 'Strong winds expected. Avoid spraying pesticides',
      });
    }

    return factors;
  }

  /**
   * Calculate confidence score based on data completeness and factor analysis
   */
  private calculateConfidence(
    context: EnhancedFarmingContext,
    factors: ExplanationFactor[]
  ): number {
    // Start with base confidence from context
    let confidence = context.computed.recommendationReadiness;

    // Adjust based on factor consistency
    const positiveFactors = factors.filter(f => f.impact === 'positive').length;
    const negativeFactors = factors.filter(f => f.impact === 'negative').length;
    const totalFactors = factors.length;

    if (totalFactors > 0) {
      // If factors are mostly aligned (either positive or negative), increase confidence
      const alignment = Math.max(positiveFactors, negativeFactors) / totalFactors;
      if (alignment > 0.7) {
        confidence = Math.min(confidence + 10, 100);
      }
    }

    // Ensure confidence is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  /**
   * Generate clear reasoning in simple language
   */
  private generateReasoning(
    input: ExplanationInput,
    factors: ExplanationFactor[]
  ): string {
    const parts: string[] = [];

    // Start with recommendation statement
    parts.push(`We recommend ${input.recommendationName} for your farm.`);

    // Add key positive factors
    const positiveFactors = factors.filter(f => f.impact === 'positive').slice(0, 2);
    if (positiveFactors.length > 0) {
      const reasons = positiveFactors.map(f => f.description.toLowerCase());
      parts.push(`This is good because ${reasons.join(' and ')}.`);
    }

    // Add key concerns if any
    const negativeFactors = factors.filter(f => f.impact === 'negative').slice(0, 2);
    if (negativeFactors.length > 0) {
      const concerns = negativeFactors.map(f => f.description);
      parts.push(`Please note: ${concerns.join('. ')}.`);
    }

    // Add action guidance based on type
    switch (input.type) {
      case 'crop':
        parts.push('Follow the step-by-step plan for best results.');
        break;
      case 'fertilizer':
        parts.push('Apply fertilizer at the right time for best results.');
        break;
      case 'seed':
        parts.push('Buy certified seeds from trusted sources.');
        break;
      case 'soil':
        parts.push('Improve your soil gradually over time.');
        break;
      case 'weather':
        parts.push('Check weather updates daily and plan your work accordingly.');
        break;
    }

    return parts.join(' ');
  }

  /**
   * Generate concise summary
   */
  private generateSummary(
    input: ExplanationInput,
    factors: ExplanationFactor[]
  ): string {
    const positiveCount = factors.filter(f => f.impact === 'positive').length;
    const negativeCount = factors.filter(f => f.impact === 'negative').length;

    if (positiveCount > negativeCount) {
      return `${input.recommendationName} is a good choice for your farm based on current conditions.`;
    } else if (negativeCount > positiveCount) {
      return `${input.recommendationName} can work but needs careful management due to some challenges.`;
    } else {
      return `${input.recommendationName} is suitable for your farm with proper care.`;
    }
  }

  /**
   * Generate explanation for crop recommendation
   */
  generateCropExplanation(
    cropName: string,
    scores: {
      suitability: number;
      profitability: number;
      risk: number;
      overall: number;
    },
    context: EnhancedFarmingContext
  ): RecommendationExplanation {
    return this.generateExplanation({
      type: 'crop',
      recommendationName: cropName,
      scores,
      context,
    });
  }

  /**
   * Generate explanation for fertilizer recommendation
   */
  generateFertilizerExplanation(
    fertilizerName: string,
    nutrient: string,
    context: EnhancedFarmingContext
  ): RecommendationExplanation {
    return this.generateExplanation({
      type: 'fertilizer',
      recommendationName: fertilizerName,
      context,
      additionalFactors: { nutrient },
    });
  }

  /**
   * Generate explanation for seed recommendation
   */
  generateSeedExplanation(
    seedVariety: string,
    cropName: string,
    context: EnhancedFarmingContext
  ): RecommendationExplanation {
    return this.generateExplanation({
      type: 'seed',
      recommendationName: `${seedVariety} (${cropName})`,
      context,
    });
  }

  /**
   * Generate explanation for soil improvement
   */
  generateSoilExplanation(
    improvementType: string,
    context: EnhancedFarmingContext
  ): RecommendationExplanation {
    return this.generateExplanation({
      type: 'soil',
      recommendationName: improvementType,
      context,
    });
  }

  /**
   * Generate explanation for weather-based advice
   */
  generateWeatherExplanation(
    advice: string,
    context: EnhancedFarmingContext
  ): RecommendationExplanation {
    return this.generateExplanation({
      type: 'weather',
      recommendationName: advice,
      context,
    });
  }
}

// Export singleton instance
export const explainabilityEngine = new ExplainabilityEngine();
