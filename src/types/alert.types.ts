/**
 * Alert and Notification Types
 * Defines interfaces for the alert and reminder system
 */

export type AlertType =
  | 'sowing'
  | 'fertilizer'
  | 'irrigation'
  | 'pest_control'
  | 'harvest'
  | 'weather'
  | 'scheme';

export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export type AlertStatus = 'scheduled' | 'sent' | 'read' | 'dismissed' | 'failed';

export type AlertChannel = 'sms' | 'push' | 'voice' | 'in_app';

/**
 * Core Alert interface
 */
export interface Alert {
  id: string;
  userId: string;
  type: AlertType;
  title: string;
  message: string;
  scheduledTime: Date;
  sentTime?: Date;
  priority: AlertPriority;
  status: AlertStatus;
  actionable: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Alert preferences for user customization
 */
export interface AlertPreferences {
  userId: string;
  enableSMS: boolean;
  enablePushNotifications: boolean;
  enableVoiceNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format (e.g., "22:00")
    end: string; // HH:mm format (e.g., "07:00")
  };
  alertTypes: {
    sowing: boolean;
    fertilizer: boolean;
    irrigation: boolean;
    pest_control: boolean;
    harvest: boolean;
    weather: boolean;
    scheme: boolean;
  };
  updatedAt: Date;
}

/**
 * Alert template for generating alerts
 */
export interface AlertTemplate {
  id: string;
  type: AlertType;
  titleTemplate: string;
  messageTemplate: string;
  priority: AlertPriority;
  actionable: boolean;
  translations: {
    [language: string]: {
      titleTemplate: string;
      messageTemplate: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Scheduled alert for crop calendar-based activities
 */
export interface ScheduledAlert {
  id: string;
  userId: string;
  type: AlertType;
  templateId: string;
  scheduledTime: Date;
  templateData: Record<string, any>; // Data to fill template placeholders
  priority: AlertPriority;
  status: 'pending' | 'scheduled' | 'sent' | 'cancelled';
  createdAt: Date;
}

/**
 * Notification delivery record
 */
export interface NotificationDelivery {
  id: string;
  alertId: string;
  userId: string;
  channel: AlertChannel;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  retryCount: number;
  metadata?: Record<string, any>;
}

/**
 * Alert scheduling request
 */
export interface AlertScheduleRequest {
  userId: string;
  type: AlertType;
  title: string;
  message: string;
  scheduledTime: Date;
  priority: AlertPriority;
  actionable?: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Alert query filters
 */
export interface AlertQueryFilters {
  userId: string;
  types?: AlertType[];
  priorities?: AlertPriority[];
  statuses?: AlertStatus[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

/**
 * Alert statistics
 */
export interface AlertStats {
  userId: string;
  totalScheduled: number;
  totalSent: number;
  totalRead: number;
  totalDismissed: number;
  byType: Record<AlertType, number>;
  byPriority: Record<AlertPriority, number>;
}
