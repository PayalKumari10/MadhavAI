/**
 * Unit tests for Weather Advisor
 */

import { weatherAdvisor } from '../WeatherAdvisor';
import { DailyForecast } from '../../../types/weather.types';

describe('WeatherAdvisor', () => {
  const createMockForecast = (overrides?: Partial<DailyForecast>): DailyForecast => ({
    date: new Date(),
    condition: 'clear',
    temperature: {
      current: 25,
      min: 20,
      max: 30,
      feelsLike: 26,
    },
    humidity: 60,
    wind: {
      speed: 10,
      direction: 'N',
    },
    precipitation: {
      probability: 10,
      amount: 0,
      type: 'none',
    },
    uvIndex: 5,
    sunrise: new Date(),
    sunset: new Date(),
    description: 'Test forecast',
    ...overrides,
  });

  describe('getAdviceForCondition', () => {
    it('should return advice for clear weather', () => {
      const advice = weatherAdvisor.getAdviceForCondition('clear');

      expect(advice.condition).toBe('clear');
      expect(advice.advice.length).toBeGreaterThan(0);
      expect(advice.doActivities.length).toBeGreaterThan(0);
      expect(advice.priority).toBe('low');
    });

    it('should return advice for rain', () => {
      const advice = weatherAdvisor.getAdviceForCondition('rain');

      expect(advice.condition).toBe('rain');
      expect(advice.priority).toBe('high');
      expect(advice.avoidActivities).toContain('All outdoor activities');
    });

    it('should return advice for thunderstorm', () => {
      const advice = weatherAdvisor.getAdviceForCondition('thunderstorm');

      expect(advice.condition).toBe('thunderstorm');
      expect(advice.priority).toBe('high');
      expect(advice.advice[0]).toContain('STAY INDOORS');
    });

    it('should return advice for heavy rain', () => {
      const advice = weatherAdvisor.getAdviceForCondition('heavy_rain');

      expect(advice.condition).toBe('heavy_rain');
      expect(advice.priority).toBe('high');
      expect(advice.avoidActivities).toContain('All outdoor farming activities');
    });
  });

  describe('getAdviceForForecast', () => {
    it('should generate advice for a forecast', () => {
      const forecast = createMockForecast();
      const advice = weatherAdvisor.getAdviceForForecast(forecast);

      expect(advice).toBeDefined();
      expect(advice.condition).toBe('clear');
    });

    it('should add high temperature advice', () => {
      const forecast = createMockForecast({
        temperature: { current: 38, min: 30, max: 42, feelsLike: 40 },
      });
      const advice = weatherAdvisor.getAdviceForForecast(forecast);

      expect(advice.advice.some((a) => a.includes('High temperature'))).toBe(true);
    });

    it('should add low temperature advice', () => {
      const forecast = createMockForecast({
        temperature: { current: 8, min: 5, max: 12, feelsLike: 6 },
      });
      const advice = weatherAdvisor.getAdviceForForecast(forecast);

      expect(advice.advice.some((a) => a.includes('Low temperature'))).toBe(true);
    });

    it('should add strong wind advice', () => {
      const forecast = createMockForecast({
        wind: { speed: 35, direction: 'N' },
      });
      const advice = weatherAdvisor.getAdviceForForecast(forecast);

      expect(advice.advice.some((a) => a.includes('Strong winds'))).toBe(true);
    });

    it('should add high precipitation probability advice', () => {
      const forecast = createMockForecast({
        precipitation: { probability: 80, amount: 20, type: 'rain' },
      });
      const advice = weatherAdvisor.getAdviceForForecast(forecast);

      expect(advice.advice.some((a) => a.includes('High chance of rain'))).toBe(true);
    });

    it('should add high UV index advice', () => {
      const forecast = createMockForecast({
        uvIndex: 10,
      });
      const advice = weatherAdvisor.getAdviceForForecast(forecast);

      expect(advice.advice.some((a) => a.includes('High UV index'))).toBe(true);
    });
  });

  describe('getWeeklyAdvice', () => {
    it('should generate advice for multiple days', () => {
      const now = new Date();
      const forecasts = [
        createMockForecast({ date: new Date(now.getTime()) }),
        createMockForecast({ date: new Date(now.getTime() + 24 * 60 * 60 * 1000), condition: 'rain' }),
        createMockForecast({ date: new Date(now.getTime() + 48 * 60 * 60 * 1000), condition: 'cloudy' }),
      ];

      const weeklyAdvice = weatherAdvisor.getWeeklyAdvice(forecasts);

      expect(weeklyAdvice.size).toBe(3);
    });
  });

  describe('getPriorityActivities', () => {
    it('should categorize activities by priority', () => {
      const forecasts = [
        createMockForecast({ condition: 'clear' }),
        createMockForecast({ condition: 'rain' }),
        createMockForecast({ condition: 'thunderstorm' }),
      ];

      const priorities = weatherAdvisor.getPriorityActivities(forecasts);

      expect(priorities.urgent.length).toBeGreaterThan(0);
      expect(priorities.recommended.length).toBeGreaterThan(0);
      expect(priorities.postpone.length).toBeGreaterThan(0);
    });

    it('should identify urgent activities for severe weather', () => {
      const forecasts = [createMockForecast({ condition: 'heavy_rain' })];

      const priorities = weatherAdvisor.getPriorityActivities(forecasts);

      expect(priorities.urgent.length).toBeGreaterThan(0);
    });
  });
});
