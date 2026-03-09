/**
 * AlertManager
 * Manages alert preferences and user customization
 */

import { logger } from '../../utils/logger';
import { AlertPreferences, AlertType } from '../../types/alert.types';
import { DatabaseService, databaseService } from '../storage/DatabaseService';

export class AlertManager {
  private db: DatabaseService;

  constructor(db?: DatabaseService) {
    this.db = db || databaseService;
  }

  /**
   * Get alert preferences for a user
   */
  async getAlertPreferences(userId: string): Promise<AlertPreferences> {
    try {
      logger.info(`Fetching alert preferences for user ${userId}`);

      const results = await this.db.query(`SELECT * FROM alert_preferences WHERE userId = ?`, [
        userId,
      ]);

      if (results.length === 0) {
        // Return default preferences if none exist
        return this.getDefaultPreferences(userId);
      }

      const row = results[0];
      return this.mapRowToPreferences(row);
    } catch (error) {
      logger.error('Failed to fetch alert preferences', error);
      throw error;
    }
  }

  /**
   * Update alert preferences for a user
   */
  async updateAlertPreferences(
    userId: string,
    preferences: Partial<AlertPreferences>
  ): Promise<void> {
    try {
      logger.info(`Updating alert preferences for user ${userId}`);

      // Check if preferences exist
      const existing = await this.db.query(
        `SELECT userId FROM alert_preferences WHERE userId = ?`,
        [userId]
      );

      const now = new Date().toISOString();

      if (existing.length === 0) {
        // Insert new preferences
        await this.insertPreferences(userId, preferences, now);
      } else {
        // Update existing preferences
        await this.updateExistingPreferences(userId, preferences, now);
      }

      logger.info(`Alert preferences updated for user ${userId}`);
    } catch (error) {
      logger.error('Failed to update alert preferences', error);
      throw error;
    }
  }

  /**
   * Enable/disable specific alert type
   */
  async setAlertTypeEnabled(userId: string, alertType: AlertType, enabled: boolean): Promise<void> {
    try {
      logger.info(`Setting ${alertType} alert to ${enabled} for user ${userId}`);

      const columnMap: Record<AlertType, string> = {
        sowing: 'alertTypeSowing',
        fertilizer: 'alertTypeFertilizer',
        irrigation: 'alertTypeIrrigation',
        pest_control: 'alertTypePestControl',
        harvest: 'alertTypeHarvest',
        weather: 'alertTypeWeather',
        scheme: 'alertTypeScheme',
      };

      const column = columnMap[alertType];
      if (!column) {
        throw new Error(`Invalid alert type: ${alertType}`);
      }

      await this.db.execute(
        `UPDATE alert_preferences SET ${column} = ?, updatedAt = ? WHERE userId = ?`,
        [enabled ? 1 : 0, new Date().toISOString(), userId]
      );

      logger.info(`Alert type ${alertType} updated successfully`);
    } catch (error) {
      logger.error('Failed to set alert type enabled', error);
      throw error;
    }
  }

  /**
   * Set quiet hours for a user
   */
  async setQuietHours(
    userId: string,
    enabled: boolean,
    start?: string,
    end?: string
  ): Promise<void> {
    try {
      logger.info(`Setting quiet hours for user ${userId}: ${enabled}`);

      // Validate time format if provided
      if (enabled && (start || end)) {
        this.validateTimeFormat(start);
        this.validateTimeFormat(end);
      }

      await this.db.execute(
        `UPDATE alert_preferences 
         SET quietHoursEnabled = ?, quietHoursStart = ?, quietHoursEnd = ?, updatedAt = ?
         WHERE userId = ?`,
        [enabled ? 1 : 0, start || null, end || null, new Date().toISOString(), userId]
      );

      logger.info(`Quiet hours updated for user ${userId}`);
    } catch (error) {
      logger.error('Failed to set quiet hours', error);
      throw error;
    }
  }

  /**
   * Check if alert should be sent based on user preferences
   */
  async shouldSendAlert(
    userId: string,
    alertType: AlertType,
    scheduledTime: Date
  ): Promise<boolean> {
    try {
      const preferences = await this.getAlertPreferences(userId);

      // Check if alert type is enabled
      if (!preferences.alertTypes[alertType]) {
        logger.info(`Alert type ${alertType} is disabled for user ${userId}`);
        return false;
      }

      // Check quiet hours
      if (preferences.quietHours.enabled) {
        const isInQuietHours = this.isInQuietHours(
          scheduledTime,
          preferences.quietHours.start,
          preferences.quietHours.end
        );

        if (isInQuietHours) {
          logger.info(`Alert falls within quiet hours for user ${userId}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      logger.error('Failed to check if alert should be sent', error);
      // Default to sending alert if check fails
      return true;
    }
  }

  /**
   * Get enabled alert channels for a user
   */
  async getEnabledChannels(userId: string): Promise<string[]> {
    try {
      const preferences = await this.getAlertPreferences(userId);
      const channels: string[] = [];

      if (preferences.enableSMS) channels.push('sms');
      if (preferences.enablePushNotifications) channels.push('push');
      if (preferences.enableVoiceNotifications) channels.push('voice');

      return channels;
    } catch (error) {
      logger.error('Failed to get enabled channels', error);
      return ['push']; // Default to push notifications
    }
  }

  /**
   * Helper: Get default preferences
   */
  private getDefaultPreferences(userId: string): AlertPreferences {
    return {
      userId,
      enableSMS: true,
      enablePushNotifications: true,
      enableVoiceNotifications: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '07:00',
      },
      alertTypes: {
        sowing: true,
        fertilizer: true,
        irrigation: true,
        pest_control: true,
        harvest: true,
        weather: true,
        scheme: true,
      },
      updatedAt: new Date(),
    };
  }

  /**
   * Helper: Insert new preferences
   */
  private async insertPreferences(
    userId: string,
    preferences: Partial<AlertPreferences>,
    timestamp: string
  ): Promise<void> {
    const defaults = this.getDefaultPreferences(userId);
    const merged = { ...defaults, ...preferences };

    await this.db.execute(
      `INSERT INTO alert_preferences (
        userId, enableSMS, enablePushNotifications, enableVoiceNotifications,
        quietHoursEnabled, quietHoursStart, quietHoursEnd,
        alertTypeSowing, alertTypeFertilizer, alertTypeIrrigation,
        alertTypePestControl, alertTypeHarvest, alertTypeWeather, alertTypeScheme,
        updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        merged.enableSMS ? 1 : 0,
        merged.enablePushNotifications ? 1 : 0,
        merged.enableVoiceNotifications ? 1 : 0,
        merged.quietHours.enabled ? 1 : 0,
        merged.quietHours.start,
        merged.quietHours.end,
        merged.alertTypes.sowing ? 1 : 0,
        merged.alertTypes.fertilizer ? 1 : 0,
        merged.alertTypes.irrigation ? 1 : 0,
        merged.alertTypes.pest_control ? 1 : 0,
        merged.alertTypes.harvest ? 1 : 0,
        merged.alertTypes.weather ? 1 : 0,
        merged.alertTypes.scheme ? 1 : 0,
        timestamp,
      ]
    );
  }

  /**
   * Helper: Update existing preferences
   */
  private async updateExistingPreferences(
    userId: string,
    preferences: Partial<AlertPreferences>,
    timestamp: string
  ): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (preferences.enableSMS !== undefined) {
      updates.push('enableSMS = ?');
      values.push(preferences.enableSMS ? 1 : 0);
    }
    if (preferences.enablePushNotifications !== undefined) {
      updates.push('enablePushNotifications = ?');
      values.push(preferences.enablePushNotifications ? 1 : 0);
    }
    if (preferences.enableVoiceNotifications !== undefined) {
      updates.push('enableVoiceNotifications = ?');
      values.push(preferences.enableVoiceNotifications ? 1 : 0);
    }
    if (preferences.quietHours) {
      if (preferences.quietHours.enabled !== undefined) {
        updates.push('quietHoursEnabled = ?');
        values.push(preferences.quietHours.enabled ? 1 : 0);
      }
      if (preferences.quietHours.start) {
        updates.push('quietHoursStart = ?');
        values.push(preferences.quietHours.start);
      }
      if (preferences.quietHours.end) {
        updates.push('quietHoursEnd = ?');
        values.push(preferences.quietHours.end);
      }
    }
    if (preferences.alertTypes) {
      const typeMap: Record<string, string> = {
        sowing: 'alertTypeSowing',
        fertilizer: 'alertTypeFertilizer',
        irrigation: 'alertTypeIrrigation',
        pest_control: 'alertTypePestControl',
        harvest: 'alertTypeHarvest',
        weather: 'alertTypeWeather',
        scheme: 'alertTypeScheme',
      };

      Object.entries(preferences.alertTypes).forEach(([type, enabled]) => {
        if (enabled !== undefined) {
          updates.push(`${typeMap[type]} = ?`);
          values.push(enabled ? 1 : 0);
        }
      });
    }

    updates.push('updatedAt = ?');
    values.push(timestamp);
    values.push(userId);

    if (updates.length > 1) {
      // More than just updatedAt
      await this.db.execute(
        `UPDATE alert_preferences SET ${updates.join(', ')} WHERE userId = ?`,
        values
      );
    }
  }

  /**
   * Helper: Map database row to AlertPreferences
   */
  private mapRowToPreferences(row: any): AlertPreferences {
    return {
      userId: row.userId,
      enableSMS: Boolean(row.enableSMS),
      enablePushNotifications: Boolean(row.enablePushNotifications),
      enableVoiceNotifications: Boolean(row.enableVoiceNotifications),
      quietHours: {
        enabled: Boolean(row.quietHoursEnabled),
        start: row.quietHoursStart || '22:00',
        end: row.quietHoursEnd || '07:00',
      },
      alertTypes: {
        sowing: Boolean(row.alertTypeSowing),
        fertilizer: Boolean(row.alertTypeFertilizer),
        irrigation: Boolean(row.alertTypeIrrigation),
        pest_control: Boolean(row.alertTypePestControl),
        harvest: Boolean(row.alertTypeHarvest),
        weather: Boolean(row.alertTypeWeather),
        scheme: Boolean(row.alertTypeScheme),
      },
      updatedAt: new Date(row.updatedAt),
    };
  }

  /**
   * Helper: Validate time format (HH:mm)
   */
  private validateTimeFormat(time?: string): void {
    if (!time) return;

    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      throw new Error(`Invalid time format: ${time}. Expected HH:mm format.`);
    }
  }

  /**
   * Helper: Check if time is within quiet hours
   */
  private isInQuietHours(time: Date, start: string, end: string): boolean {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
}

// Export singleton instance
export const alertManager = new AlertManager();
