/**
 * Unit tests for Alert Generator
 */

import { alertGenerator } from '../AlertGenerator';
import { DailyForecast, WeatherAlert } from '../../../types/weather.types';

describe('AlertGenerator', () => {
  const createMockForecast = (overrides?: Partial<DailyForecast>): DailyForecast => ({
    date: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
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

  describe('generateAlerts', () => {
    it('should generate alert for heavy rain', () => {
      const forecasts = [
        createMockForecast({
          condition: 'heavy_rain',
          precipitation: { probability: 90, amount: 60, type: 'rain' },
        }),
      ];

      const alerts = alertGenerator.generateAlerts(forecasts, 'Test Location');

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('heavy_rain');
      expect(alerts[0].severity).toBe('severe');
    });

    it('should generate alert for thunderstorm', () => {
      const forecasts = [createMockForecast({ condition: 'thunderstorm' })];

      const alerts = alertGenerator.generateAlerts(forecasts, 'Test Location');

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('thunderstorm');
      expect(alerts[0].severity).toBe('severe');
    });

    it('should generate alert for hail', () => {
      const forecasts = [createMockForecast({ condition: 'hail' })];

      const alerts = alertGenerator.generateAlerts(forecasts, 'Test Location');

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('hail');
    });

    it('should generate alert for heat wave', () => {
      const forecasts = [
        createMockForecast({
          temperature: { current: 42, min: 35, max: 45, feelsLike: 44 },
        }),
      ];

      const alerts = alertGenerator.generateAlerts(forecasts, 'Test Location');

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('heat_wave');
    });

    it('should generate alert for cold wave', () => {
      const forecasts = [
        createMockForecast({
          temperature: { current: 3, min: 2, max: 8, feelsLike: 1 },
        }),
      ];

      const alerts = alertGenerator.generateAlerts(forecasts, 'Test Location');

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('cold_wave');
    });

    it('should generate alert for high winds', () => {
      const forecasts = [createMockForecast({ wind: { speed: 45, direction: 'N' } })];

      const alerts = alertGenerator.generateAlerts(forecasts, 'Test Location');

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('wind');
    });

    it('should not generate alerts for events beyond 48 hours', () => {
      const forecasts = [
        createMockForecast({
          date: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours from now
          condition: 'heavy_rain',
        }),
      ];

      const alerts = alertGenerator.generateAlerts(forecasts, 'Test Location');

      expect(alerts.length).toBe(0);
    });
  });

  describe('shouldSendAdvanceAlert', () => {
    it('should send advance alert for severe weather 24 hours before', () => {
      const alert: WeatherAlert = {
        id: 'test_1',
        type: 'thunderstorm',
        severity: 'severe',
        title: 'Test Alert',
        description: 'Test',
        startTime: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours from now
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        affectedAreas: ['Test'],
        farmingAdvice: 'Test advice',
      };

      const shouldSend = alertGenerator.shouldSendAdvanceAlert(alert);

      expect(shouldSend).toBe(true);
    });

    it('should send advance alert for high severity 12 hours before', () => {
      const alert: WeatherAlert = {
        id: 'test_2',
        type: 'heat_wave',
        severity: 'high',
        title: 'Test Alert',
        description: 'Test',
        startTime: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        affectedAreas: ['Test'],
        farmingAdvice: 'Test advice',
      };

      const shouldSend = alertGenerator.shouldSendAdvanceAlert(alert);

      expect(shouldSend).toBe(true);
    });

    it('should not send alert too early', () => {
      const alert: WeatherAlert = {
        id: 'test_3',
        type: 'thunderstorm',
        severity: 'severe',
        title: 'Test Alert',
        description: 'Test',
        startTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
        endTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
        affectedAreas: ['Test'],
        farmingAdvice: 'Test advice',
      };

      const shouldSend = alertGenerator.shouldSendAdvanceAlert(alert);

      expect(shouldSend).toBe(false);
    });
  });

  describe('getAlertsForNotification', () => {
    it('should filter alerts that need notification', () => {
      const alerts: WeatherAlert[] = [
        {
          id: 'test_1',
          type: 'thunderstorm',
          severity: 'severe',
          title: 'Test Alert 1',
          description: 'Test',
          startTime: new Date(Date.now() + 20 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          affectedAreas: ['Test'],
          farmingAdvice: 'Test advice',
        },
        {
          id: 'test_2',
          type: 'fog',
          severity: 'medium',
          title: 'Test Alert 2',
          description: 'Test',
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
          affectedAreas: ['Test'],
          farmingAdvice: 'Test advice',
        },
      ];

      const notificationAlerts = alertGenerator.getAlertsForNotification(alerts);

      expect(notificationAlerts.length).toBeGreaterThan(0);
    });
  });

  describe('filterAlertsBySeverity', () => {
    it('should filter alerts by severity', () => {
      const alerts: WeatherAlert[] = [
        {
          id: 'test_1',
          type: 'thunderstorm',
          severity: 'severe',
          title: 'Severe Alert',
          description: 'Test',
          startTime: new Date(),
          endTime: new Date(),
          affectedAreas: ['Test'],
          farmingAdvice: 'Test',
        },
        {
          id: 'test_2',
          type: 'fog',
          severity: 'medium',
          title: 'Medium Alert',
          description: 'Test',
          startTime: new Date(),
          endTime: new Date(),
          affectedAreas: ['Test'],
          farmingAdvice: 'Test',
        },
      ];

      const severeAlerts = alertGenerator.filterAlertsBySeverity(alerts, 'severe');

      expect(severeAlerts.length).toBe(1);
      expect(severeAlerts[0].severity).toBe('severe');
    });
  });

  describe('getMostSevereAlert', () => {
    it('should return most severe alert', () => {
      const alerts: WeatherAlert[] = [
        {
          id: 'test_1',
          type: 'fog',
          severity: 'medium',
          title: 'Medium Alert',
          description: 'Test',
          startTime: new Date(),
          endTime: new Date(),
          affectedAreas: ['Test'],
          farmingAdvice: 'Test',
        },
        {
          id: 'test_2',
          type: 'thunderstorm',
          severity: 'severe',
          title: 'Severe Alert',
          description: 'Test',
          startTime: new Date(),
          endTime: new Date(),
          affectedAreas: ['Test'],
          farmingAdvice: 'Test',
        },
      ];

      const mostSevere = alertGenerator.getMostSevereAlert(alerts);

      expect(mostSevere?.severity).toBe('severe');
    });

    it('should return null for empty array', () => {
      const mostSevere = alertGenerator.getMostSevereAlert([]);

      expect(mostSevere).toBeNull();
    });
  });

  describe('formatAlertMessage', () => {
    it('should format alert message', () => {
      const alert: WeatherAlert = {
        id: 'test_1',
        type: 'thunderstorm',
        severity: 'severe',
        title: 'Thunderstorm Alert',
        description: 'Severe thunderstorm expected',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
        affectedAreas: ['Test Location'],
        farmingAdvice: 'Stay indoors',
      };

      const message = alertGenerator.formatAlertMessage(alert);

      expect(message).toContain('Thunderstorm Alert');
      expect(message).toContain('Severe thunderstorm expected');
      expect(message).toContain('Stay indoors');
    });
  });
});
