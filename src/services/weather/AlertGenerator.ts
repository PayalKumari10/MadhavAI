/**
 * Alert Generator
 * Generates severe weather alerts and warnings
 * Requirements: 6.3
 */

import { WeatherAlert, DailyForecast, AlertSeverity } from '../../types/weather.types';
import { logger } from '../../utils/logger';

interface AlertRule {
  condition: (forecast: DailyForecast) => boolean;
  type: WeatherAlert['type'];
  severity: AlertSeverity;
  title: string;
  descriptionTemplate: (forecast: DailyForecast) => string;
  farmingAdvice: string;
}

class AlertGenerator {
  private alertRules: AlertRule[] = [
    {
      condition: (f) => f.condition === 'heavy_rain' || f.precipitation.amount > 50,
      type: 'heavy_rain',
      severity: 'severe',
      title: 'Heavy Rain Warning',
      descriptionTemplate: (f) =>
        `Heavy rainfall expected with ${f.precipitation.amount}mm precipitation. High risk of waterlogging.`,
      farmingAdvice:
        'Ensure proper drainage in fields. Avoid all outdoor activities. Protect harvested crops from moisture.',
    },
    {
      condition: (f) => f.condition === 'thunderstorm',
      type: 'thunderstorm',
      severity: 'severe',
      title: 'Thunderstorm Alert',
      descriptionTemplate: () =>
        'Thunderstorm with lightning expected. Dangerous conditions for outdoor activities.',
      farmingAdvice:
        'Stay indoors. Avoid using electrical equipment. Keep away from trees and metal structures.',
    },
    {
      condition: (f) => f.condition === 'hail',
      type: 'hail',
      severity: 'severe',
      title: 'Hail Storm Warning',
      descriptionTemplate: () => 'Hailstorm expected. Crops and property at risk of damage.',
      farmingAdvice:
        'Protect crops if possible. Stay indoors during hail. Document any damage for insurance.',
    },
    {
      condition: (f) => f.temperature.max > 40,
      type: 'heat_wave',
      severity: 'high',
      title: 'Heat Wave Alert',
      descriptionTemplate: (f) =>
        `Extreme heat expected with temperatures reaching ${f.temperature.max}°C.`,
      farmingAdvice:
        'Increase irrigation frequency. Avoid outdoor work during peak heat (12 PM - 3 PM). Ensure adequate water for livestock.',
    },
    {
      condition: (f) => f.temperature.min < 5,
      type: 'cold_wave',
      severity: 'high',
      title: 'Cold Wave Warning',
      descriptionTemplate: (f) =>
        `Severe cold expected with temperatures dropping to ${f.temperature.min}°C.`,
      farmingAdvice:
        'Protect sensitive crops from frost. Provide shelter for livestock. Cover young plants.',
    },
    {
      condition: (f) => f.condition === 'fog',
      type: 'fog',
      severity: 'medium',
      title: 'Dense Fog Advisory',
      descriptionTemplate: () => 'Dense fog expected. Reduced visibility conditions.',
      farmingAdvice:
        'Delay spraying activities. Avoid operating heavy machinery. Wait for visibility to improve.',
    },
    {
      condition: (f) => f.wind.speed > 40,
      type: 'wind',
      severity: 'high',
      title: 'High Wind Warning',
      descriptionTemplate: (f) => `Strong winds expected with speeds up to ${f.wind.speed} km/h.`,
      farmingAdvice:
        'Secure loose items and equipment. Avoid pesticide spraying. Protect greenhouse structures.',
    },
  ];

  /**
   * Generate alerts for a forecast
   * Requirements: 6.3
   */
  generateAlerts(forecasts: DailyForecast[], location: string): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    const now = new Date();

    forecasts.forEach((forecast) => {
      const forecastDate = new Date(forecast.date);
      const hoursUntil = (forecastDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Only generate alerts for events within next 48 hours
      if (hoursUntil > 48) {
        return;
      }

      this.alertRules.forEach((rule) => {
        if (rule.condition(forecast)) {
          const alert: WeatherAlert = {
            id: this.generateAlertId(rule.type, forecast.date),
            type: rule.type,
            severity: rule.severity,
            title: rule.title,
            description: rule.descriptionTemplate(forecast),
            startTime: forecast.date,
            endTime: new Date(forecast.date.getTime() + 24 * 60 * 60 * 1000), // 24 hours
            affectedAreas: [location],
            farmingAdvice: rule.farmingAdvice,
          };

          alerts.push(alert);
          logger.info(`Generated ${rule.severity} alert: ${rule.title} for ${forecast.date}`);
        }
      });
    });

    return alerts;
  }

  /**
   * Check if alerts should be sent 24 hours in advance
   * Requirements: 6.3
   */
  shouldSendAdvanceAlert(alert: WeatherAlert): boolean {
    const now = new Date();
    const alertTime = new Date(alert.startTime);
    const hoursUntil = (alertTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Send alerts for severe weather 24 hours in advance
    if (alert.severity === 'severe' && hoursUntil <= 24 && hoursUntil > 0) {
      logger.info(`Advance alert should be sent for: ${alert.title}`);
      return true;
    }

    // Send high severity alerts 12 hours in advance
    if (alert.severity === 'high' && hoursUntil <= 12 && hoursUntil > 0) {
      logger.info(`Advance alert should be sent for: ${alert.title}`);
      return true;
    }

    return false;
  }

  /**
   * Get alerts that need immediate notification
   */
  getAlertsForNotification(alerts: WeatherAlert[]): WeatherAlert[] {
    return alerts.filter((alert) => this.shouldSendAdvanceAlert(alert));
  }

  /**
   * Filter alerts by severity
   */
  filterAlertsBySeverity(alerts: WeatherAlert[], severity: AlertSeverity): WeatherAlert[] {
    return alerts.filter((alert) => alert.severity === severity);
  }

  /**
   * Get most severe alert
   */
  getMostSevereAlert(alerts: WeatherAlert[]): WeatherAlert | null {
    if (alerts.length === 0) return null;

    const severityOrder: AlertSeverity[] = ['severe', 'high', 'medium', 'low'];

    for (const severity of severityOrder) {
      const alert = alerts.find((a) => a.severity === severity);
      if (alert) return alert;
    }

    return alerts[0];
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(type: string, date: Date): string {
    const dateStr = date.toISOString().split('T')[0];
    return `alert_${type}_${dateStr}_${Date.now()}`;
  }

  /**
   * Format alert for display
   */
  formatAlertMessage(alert: WeatherAlert): string {
    const timeUntil = this.getTimeUntilAlert(alert);
    return `${alert.title}\n${timeUntil}\n\n${alert.description}\n\nFarming Advice: ${alert.farmingAdvice}`;
  }

  /**
   * Get human-readable time until alert
   */
  private getTimeUntilAlert(alert: WeatherAlert): string {
    const now = new Date();
    const alertTime = new Date(alert.startTime);
    const hoursUntil = Math.round((alertTime.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (hoursUntil < 1) return 'Starting now';
    if (hoursUntil === 1) return 'Starting in 1 hour';
    if (hoursUntil < 24) return `Starting in ${hoursUntil} hours`;

    const daysUntil = Math.round(hoursUntil / 24);
    if (daysUntil === 1) return 'Starting tomorrow';
    return `Starting in ${daysUntil} days`;
  }
}

export const alertGenerator = new AlertGenerator();
