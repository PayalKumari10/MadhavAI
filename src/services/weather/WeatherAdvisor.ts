/**
 * Weather Advisor
 * Generates farming advice based on weather conditions
 * Requirements: 6.2
 */

import { WeatherCondition, FarmingAdvice, DailyForecast } from '../../types/weather.types';
import { logger } from '../../utils/logger';

class WeatherAdvisor {
  /**
   * Get farming advice based on weather condition
   * Requirements: 6.2
   */
  getAdviceForCondition(condition: WeatherCondition): FarmingAdvice {
    const adviceMap: Record<WeatherCondition, FarmingAdvice> = {
      clear: {
        condition: 'clear',
        advice: [
          'Excellent day for outdoor farming activities',
          'Good time for harvesting crops',
          'Ideal for spraying pesticides and fertilizers',
        ],
        doActivities: [
          'Harvesting',
          'Plowing and tilling',
          'Pesticide application',
          'Fertilizer application',
          'Irrigation system maintenance',
        ],
        avoidActivities: [],
        priority: 'low',
      },
      partly_cloudy: {
        condition: 'partly_cloudy',
        advice: [
          'Good conditions for most farming activities',
          'Comfortable temperature for outdoor work',
          'Monitor weather updates for changes',
        ],
        doActivities: [
          'Sowing seeds',
          'Transplanting seedlings',
          'Weeding',
          'General field maintenance',
        ],
        avoidActivities: [],
        priority: 'low',
      },
      cloudy: {
        condition: 'cloudy',
        advice: [
          'Suitable for most farming activities',
          'Reduced sun exposure - good for workers',
          'Watch for potential rain',
        ],
        doActivities: [
          'Weeding',
          'Pruning',
          'Field inspection',
          'Equipment maintenance',
        ],
        avoidActivities: ['Pesticide spraying (if rain expected)'],
        priority: 'low',
      },
      drizzle: {
        condition: 'drizzle',
        advice: [
          'Light rain - limit outdoor activities',
          'Good natural irrigation for crops',
          'Avoid chemical applications',
        ],
        doActivities: ['Indoor planning', 'Equipment preparation', 'Record keeping'],
        avoidActivities: [
          'Pesticide application',
          'Fertilizer application',
          'Harvesting',
          'Heavy machinery operation',
        ],
        priority: 'medium',
      },
      rain: {
        condition: 'rain',
        advice: [
          'Postpone outdoor farming activities',
          'Natural irrigation - reduce manual watering',
          'Check drainage systems',
          'Protect harvested crops from moisture',
        ],
        doActivities: [
          'Indoor work',
          'Planning next activities',
          'Equipment maintenance under shelter',
        ],
        avoidActivities: [
          'All outdoor activities',
          'Pesticide/fertilizer application',
          'Harvesting',
          'Plowing',
        ],
        priority: 'high',
      },
      heavy_rain: {
        condition: 'heavy_rain',
        advice: [
          'AVOID all outdoor activities',
          'Check for waterlogging in fields',
          'Ensure proper drainage',
          'Protect stored crops and equipment',
          'Monitor for flooding',
        ],
        doActivities: ['Emergency preparations', 'Secure equipment and crops'],
        avoidActivities: ['All outdoor farming activities'],
        priority: 'high',
      },
      thunderstorm: {
        condition: 'thunderstorm',
        advice: [
          'STAY INDOORS - Lightning danger',
          'Avoid using electrical equipment',
          'Keep away from trees and metal structures',
          'Secure loose items that could blow away',
        ],
        doActivities: ['Stay indoors', 'Safety first'],
        avoidActivities: ['All outdoor activities', 'Using electrical equipment outdoors'],
        priority: 'high',
      },
      fog: {
        condition: 'fog',
        advice: [
          'Reduced visibility - be cautious',
          'Delay spraying activities',
          'Good moisture for crops',
          'Wait for fog to clear before machinery operation',
        ],
        doActivities: ['Wait for visibility to improve', 'Indoor planning'],
        avoidActivities: [
          'Pesticide spraying',
          'Operating heavy machinery',
          'Activities requiring good visibility',
        ],
        priority: 'medium',
      },
      hail: {
        condition: 'hail',
        advice: [
          'URGENT: Protect crops if possible',
          'Stay indoors during hailstorm',
          'Assess crop damage after storm',
          'Document damage for insurance',
        ],
        doActivities: ['Emergency crop protection', 'Damage assessment after storm'],
        avoidActivities: ['All outdoor activities during hail'],
        priority: 'high',
      },
      snow: {
        condition: 'snow',
        advice: [
          'Protect sensitive crops from frost',
          'Ensure livestock have shelter',
          'Clear snow from greenhouse roofs',
          'Avoid outdoor activities',
        ],
        doActivities: ['Frost protection measures', 'Livestock care'],
        avoidActivities: ['Most outdoor farming activities', 'Irrigation'],
        priority: 'high',
      },
    };

    return adviceMap[condition];
  }

  /**
   * Get comprehensive advice for a forecast
   */
  getAdviceForForecast(forecast: DailyForecast): FarmingAdvice {
    const baseAdvice = this.getAdviceForCondition(forecast.condition);

    // Add temperature-specific advice
    if (forecast.temperature.max > 35) {
      baseAdvice.advice.push('High temperature - ensure adequate irrigation');
      baseAdvice.advice.push('Avoid working during peak heat hours (12 PM - 3 PM)');
    }

    if (forecast.temperature.min < 10) {
      baseAdvice.advice.push('Low temperature - protect sensitive crops from cold');
    }

    // Add wind-specific advice
    if (forecast.wind.speed > 30) {
      baseAdvice.advice.push('Strong winds - secure loose items and avoid spraying');
      baseAdvice.avoidActivities.push('Pesticide/fertilizer spraying');
    }

    // Add precipitation-specific advice
    if (forecast.precipitation.probability > 70) {
      baseAdvice.advice.push('High chance of rain - plan indoor activities');
      baseAdvice.avoidActivities.push('Chemical applications');
    }

    // Add UV index advice
    if (forecast.uvIndex > 8) {
      baseAdvice.advice.push('High UV index - use sun protection for outdoor work');
    }

    logger.debug(`Generated advice for ${forecast.condition} condition`);
    return baseAdvice;
  }

  /**
   * Get advice for multiple days
   */
  getWeeklyAdvice(forecasts: DailyForecast[]): Map<string, FarmingAdvice> {
    const weeklyAdvice = new Map<string, FarmingAdvice>();

    forecasts.forEach((forecast) => {
      const dateKey = forecast.date.toISOString().split('T')[0];
      weeklyAdvice.set(dateKey, this.getAdviceForForecast(forecast));
    });

    logger.info(`Generated advice for ${forecasts.length} days`);
    return weeklyAdvice;
  }

  /**
   * Get priority activities for the week
   */
  getPriorityActivities(forecasts: DailyForecast[]): {
    urgent: string[];
    recommended: string[];
    postpone: string[];
  } {
    const urgent: string[] = [];
    const recommended: string[] = [];
    const postpone: string[] = [];

    forecasts.forEach((forecast, index) => {
      const advice = this.getAdviceForForecast(forecast);
      const dayLabel = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : `Day ${index + 1}`;

      if (advice.priority === 'high') {
        urgent.push(`${dayLabel}: ${advice.advice[0]}`);
        postpone.push(...advice.avoidActivities.map((a) => `${dayLabel}: ${a}`));
      } else if (advice.priority === 'medium') {
        recommended.push(`${dayLabel}: ${advice.doActivities[0] || 'Plan activities'}`);
      } else {
        recommended.push(...advice.doActivities.slice(0, 2).map((a) => `${dayLabel}: ${a}`));
      }
    });

    return {
      urgent: [...new Set(urgent)],
      recommended: [...new Set(recommended)].slice(0, 5),
      postpone: [...new Set(postpone)].slice(0, 5),
    };
  }
}

export const weatherAdvisor = new WeatherAdvisor();
