/**
 * NotificationService
 * Handles multi-channel notification delivery (SMS, push, voice)
 */

import { logger } from '../../utils/logger';
import { Alert, AlertChannel, NotificationDelivery } from '../../types/alert.types';
import { DatabaseService, databaseService } from '../storage/DatabaseService';
import { alertManager } from './AlertManager';

// Mock AWS SNS client - in production, this would be the actual AWS SDK
interface SNSClient {
  publish(params: {
    PhoneNumber: string;
    Message: string;
    MessageAttributes?: any;
  }): Promise<{ MessageId: string }>;
}

export class NotificationService {
  private db: DatabaseService;
  private snsClient?: SNSClient;
  private appStateChecker: () => 'active' | 'background' | 'inactive';

  constructor(
    db?: DatabaseService,
    snsClient?: SNSClient,
    appStateChecker?: () => 'active' | 'background' | 'inactive'
  ) {
    this.db = db || databaseService;
    this.snsClient = snsClient;
    this.appStateChecker = appStateChecker || (() => 'active');
  }

  /**
   * Send notification for an alert through appropriate channels
   */
  async sendNotification(alert: Alert, userPhoneNumber?: string): Promise<void> {
    try {
      logger.info(`Sending notification for alert ${alert.id}`);

      // Get user's enabled channels
      const enabledChannels = await alertManager.getEnabledChannels(alert.userId);

      // Check if alert should be sent based on preferences
      const shouldSend = await alertManager.shouldSendAlert(
        alert.userId,
        alert.type,
        alert.scheduledTime
      );

      if (!shouldSend) {
        logger.info(`Alert ${alert.id} blocked by user preferences`);
        return;
      }

      // Determine which channel to use based on app state
      const appState = this.appStateChecker();
      const channel = this.selectChannel(appState, enabledChannels);

      logger.info(`Selected channel: ${channel} (app state: ${appState})`);

      // Send through selected channel
      switch (channel) {
        case 'sms':
          await this.sendSMS(alert, userPhoneNumber);
          break;
        case 'voice':
          await this.sendVoiceNotification(alert);
          break;
        case 'push':
        case 'in_app':
          await this.sendPushNotification(alert);
          break;
        default:
          logger.warn(`Unknown channel: ${channel}`);
      }

      logger.info(`Notification sent successfully for alert ${alert.id}`);
    } catch (error) {
      logger.error('Failed to send notification', error);
      throw error;
    }
  }

  /**
   * Send SMS notification via AWS SNS
   */
  async sendSMS(alert: Alert, phoneNumber?: string): Promise<void> {
    try {
      logger.info(`Sending SMS for alert ${alert.id}`);

      if (!phoneNumber) {
        throw new Error('Phone number is required for SMS delivery');
      }

      if (!this.snsClient) {
        logger.warn('SNS client not configured, skipping SMS');
        await this.recordDelivery(
          alert.id,
          alert.userId,
          'sms',
          'failed',
          'SNS client not configured'
        );
        return;
      }

      // Format message for SMS
      const message = this.formatSMSMessage(alert);

      // Send via AWS SNS
      const result = await this.snsClient.publish({
        PhoneNumber: phoneNumber,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: alert.priority === 'critical' ? 'Transactional' : 'Promotional',
          },
        },
      });

      logger.info(`SMS sent successfully: ${result.MessageId}`);

      // Record successful delivery
      await this.recordDelivery(alert.id, alert.userId, 'sms', 'sent', undefined, {
        messageId: result.MessageId,
      });
    } catch (error) {
      logger.error('Failed to send SMS', error);
      await this.recordDelivery(
        alert.id,
        alert.userId,
        'sms',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Send push notification (in-app)
   */
  async sendPushNotification(alert: Alert): Promise<void> {
    try {
      logger.info(`Sending push notification for alert ${alert.id}`);

      // In a real implementation, this would use a push notification service
      // like Firebase Cloud Messaging (FCM) or Apple Push Notification Service (APNS)

      // For now, we'll just record the delivery
      await this.recordDelivery(alert.id, alert.userId, 'push', 'sent', undefined, {
        title: alert.title,
        message: alert.message,
      });

      logger.info(`Push notification sent for alert ${alert.id}`);
    } catch (error) {
      logger.error('Failed to send push notification', error);
      await this.recordDelivery(
        alert.id,
        alert.userId,
        'push',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Send voice notification (text-to-speech when app is active)
   */
  async sendVoiceNotification(alert: Alert): Promise<void> {
    try {
      logger.info(`Sending voice notification for alert ${alert.id}`);

      // In a real implementation, this would use text-to-speech
      // to read the alert message in the user's preferred language

      // For now, we'll just record the delivery
      await this.recordDelivery(alert.id, alert.userId, 'voice', 'sent', undefined, {
        message: alert.message,
      });

      logger.info(`Voice notification sent for alert ${alert.id}`);
    } catch (error) {
      logger.error('Failed to send voice notification', error);
      await this.recordDelivery(
        alert.id,
        alert.userId,
        'voice',
        'failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Batch send notifications for multiple alerts
   */
  async sendBatchNotifications(
    alerts: Alert[],
    userPhoneNumbers: Map<string, string>
  ): Promise<void> {
    logger.info(`Sending batch notifications for ${alerts.length} alerts`);

    const results = await Promise.allSettled(
      alerts.map((alert) => this.sendNotification(alert, userPhoneNumbers.get(alert.userId)))
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    logger.info(`Batch send complete: ${successful} successful, ${failed} failed`);
  }

  /**
   * Retry failed notification deliveries
   */
  async retryFailedDeliveries(maxRetries: number = 3): Promise<void> {
    try {
      logger.info('Retrying failed notification deliveries');

      const failedDeliveries = await this.db.query(
        `SELECT * FROM notification_deliveries 
         WHERE status = ? AND retryCount < ?`,
        ['failed', maxRetries]
      );

      logger.info(`Found ${failedDeliveries.length} failed deliveries to retry`);

      for (const delivery of failedDeliveries) {
        try {
          // Get the original alert
          const alertResults = await this.db.query(`SELECT * FROM alerts WHERE id = ?`, [
            delivery.alertId,
          ]);

          if (alertResults.length === 0) {
            logger.warn(`Alert ${delivery.alertId} not found, skipping retry`);
            continue;
          }

          const alert = this.mapRowToAlert(alertResults[0]);

          // Retry based on channel
          switch (delivery.channel) {
            case 'sms':
              await this.sendSMS(alert);
              break;
            case 'push':
              await this.sendPushNotification(alert);
              break;
            case 'voice':
              await this.sendVoiceNotification(alert);
              break;
          }

          // Update retry count
          await this.db.execute(
            `UPDATE notification_deliveries 
             SET retryCount = retryCount + 1 
             WHERE id = ?`,
            [delivery.id]
          );
        } catch (error) {
          logger.error(`Failed to retry delivery ${delivery.id}`, error);
        }
      }

      logger.info('Retry process completed');
    } catch (error) {
      logger.error('Failed to retry deliveries', error);
      throw error;
    }
  }

  /**
   * Get delivery history for an alert
   */
  async getDeliveryHistory(alertId: string): Promise<NotificationDelivery[]> {
    try {
      const results = await this.db.query(
        `SELECT * FROM notification_deliveries WHERE alertId = ? ORDER BY sentAt DESC`,
        [alertId]
      );

      return results.map((row: any) => this.mapRowToDelivery(row));
    } catch (error) {
      logger.error('Failed to get delivery history', error);
      throw error;
    }
  }

  /**
   * Helper: Select appropriate channel based on app state and preferences
   */
  private selectChannel(
    appState: 'active' | 'background' | 'inactive',
    enabledChannels: string[]
  ): AlertChannel {
    // If app is active, prefer voice or push notifications
    if (appState === 'active') {
      if (enabledChannels.includes('voice')) return 'voice';
      if (enabledChannels.includes('push')) return 'push';
    }

    // If app is inactive or background, prefer SMS
    if (appState === 'inactive' || appState === 'background') {
      if (enabledChannels.includes('sms')) return 'sms';
    }

    // Fallback to push notification
    return 'push';
  }

  /**
   * Helper: Format SMS message
   */
  private formatSMSMessage(alert: Alert): string {
    let message = `${alert.title}\n\n${alert.message}`;

    if (alert.actionUrl) {
      message += `\n\nView details in the app.`;
    }

    // SMS has character limits, truncate if necessary
    const MAX_SMS_LENGTH = 160;
    if (message.length > MAX_SMS_LENGTH) {
      message = message.substring(0, MAX_SMS_LENGTH - 3) + '...';
    }

    return message;
  }

  /**
   * Helper: Record notification delivery
   */
  private async recordDelivery(
    alertId: string,
    userId: string,
    channel: AlertChannel,
    status: 'sent' | 'failed',
    failureReason?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      await this.db.execute(
        `INSERT INTO notification_deliveries (
          id, alertId, userId, channel, status, sentAt, 
          failureReason, retryCount, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          deliveryId,
          alertId,
          userId,
          channel,
          status,
          now,
          failureReason || null,
          0,
          JSON.stringify(metadata || {}),
        ]
      );
    } catch (error) {
      logger.error('Failed to record delivery', error);
      // Don't throw - recording failure shouldn't break notification
    }
  }

  /**
   * Helper: Map database row to Alert
   */
  private mapRowToAlert(row: any): Alert {
    return {
      id: row.id,
      userId: row.userId,
      type: row.type,
      title: row.title,
      message: row.message,
      scheduledTime: new Date(row.scheduledTime),
      sentTime: row.sentTime ? new Date(row.sentTime) : undefined,
      priority: row.priority,
      status: row.status,
      actionable: Boolean(row.actionable),
      actionUrl: row.actionUrl || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }

  /**
   * Helper: Map database row to NotificationDelivery
   */
  private mapRowToDelivery(row: any): NotificationDelivery {
    return {
      id: row.id,
      alertId: row.alertId,
      userId: row.userId,
      channel: row.channel as AlertChannel,
      status: row.status,
      sentAt: row.sentAt ? new Date(row.sentAt) : undefined,
      deliveredAt: row.deliveredAt ? new Date(row.deliveredAt) : undefined,
      failureReason: row.failureReason || undefined,
      retryCount: row.retryCount,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
