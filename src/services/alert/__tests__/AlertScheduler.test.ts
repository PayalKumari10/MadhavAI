/**
 * AlertScheduler Tests
 * Unit tests for alert scheduling functionality
 */

import { AlertScheduler } from '../AlertScheduler';
import { DatabaseService } from '../../storage/DatabaseService';
import { AlertScheduleRequest } from '../../../types/alert.types';

// Mock DatabaseService
jest.mock('../../storage/DatabaseService');

describe('AlertScheduler', () => {
  let alertScheduler: AlertScheduler;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDb = {
      execute: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([]),
    } as any;

    alertScheduler = new AlertScheduler(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scheduleAlert', () => {
    it('should schedule a new alert successfully', async () => {
      const request: AlertScheduleRequest = {
        userId: 'user123',
        type: 'sowing',
        title: 'Sowing Reminder',
        message: 'Time to sow wheat',
        scheduledTime: new Date(Date.now() + 86400000), // Tomorrow
        priority: 'high',
      };

      const alertId = await alertScheduler.scheduleAlert(request);

      expect(alertId).toBeDefined();
      expect(alertId).toMatch(/^alert_/);
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO alerts'),
        expect.arrayContaining([
          expect.stringMatching(/^alert_/),
          'user123',
          'sowing',
          'Sowing Reminder',
          'Time to sow wheat',
        ])
      );
    });

    it('should reject scheduling alert in the past', async () => {
      const request: AlertScheduleRequest = {
        userId: 'user123',
        type: 'sowing',
        title: 'Past Alert',
        message: 'This should fail',
        scheduledTime: new Date(Date.now() - 86400000), // Yesterday
        priority: 'medium',
      };

      await expect(alertScheduler.scheduleAlert(request)).rejects.toThrow(
        'Scheduled time must be in the future'
      );
    });

    it('should include metadata in scheduled alert', async () => {
      const request: AlertScheduleRequest = {
        userId: 'user123',
        type: 'weather',
        title: 'Weather Alert',
        message: 'Heavy rain expected',
        scheduledTime: new Date(Date.now() + 86400000),
        priority: 'critical',
        metadata: {
          weatherType: 'heavy_rain',
          severity: 'high',
        },
      };

      await alertScheduler.scheduleAlert(request);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.stringContaining('{"weatherType":"heavy_rain","severity":"high"}'),
        ])
      );
    });
  });

  describe('cancelAlert', () => {
    it('should cancel a scheduled alert', async () => {
      const alertId = 'alert_123';

      await alertScheduler.cancelAlert(alertId);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE alerts SET status = ?'),
        expect.arrayContaining(['dismissed', expect.any(String), alertId, 'scheduled'])
      );
    });
  });

  describe('getUpcomingAlerts', () => {
    it('should fetch upcoming alerts for a user', async () => {
      const userId = 'user123';
      const mockAlerts = [
        {
          id: 'alert_1',
          userId: 'user123',
          type: 'sowing',
          title: 'Sowing Reminder',
          message: 'Time to sow',
          scheduledTime: new Date().toISOString(),
          priority: 'high',
          status: 'scheduled',
          actionable: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockDb.query.mockResolvedValue(mockAlerts);

      const alerts = await alertScheduler.getUpcomingAlerts(userId, 7);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].id).toBe('alert_1');
      expect(alerts[0].type).toBe('sowing');
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE userId = ?'),
        expect.arrayContaining([userId, expect.any(String), expect.any(String)])
      );
    });
  });

  describe('scheduleCropActivityAlerts', () => {
    it('should schedule multiple alerts for crop activities', async () => {
      const userId = 'user123';
      const cropPlanId = 'plan_456';
      const activities = [
        {
          type: 'sowing' as const,
          activityDate: new Date(Date.now() + 172800000), // 2 days from now
          cropName: 'Wheat',
          activityName: 'Sowing',
        },
        {
          type: 'fertilizer' as const,
          activityDate: new Date(Date.now() + 259200000), // 3 days from now
          cropName: 'Wheat',
          activityName: 'First Fertilizer Application',
        },
      ];

      const alertIds = await alertScheduler.scheduleCropActivityAlerts(
        userId,
        cropPlanId,
        activities
      );

      expect(alertIds).toHaveLength(2);
      expect(mockDb.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('scheduleWeatherAlert', () => {
    it('should schedule weather alert 24 hours before event', async () => {
      const userId = 'user123';
      const weatherType = 'heavy_rain';
      const severity = 'severe';
      const startTime = new Date(Date.now() + 86400000 * 2); // 2 days from now
      const message = 'Heavy rain expected';

      const alertId = await alertScheduler.scheduleWeatherAlert(
        userId,
        weatherType,
        severity,
        startTime,
        message
      );

      expect(alertId).toBeDefined();
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO alerts'),
        expect.arrayContaining([
          expect.any(String),
          userId,
          'weather',
          'Weather Alert: heavy_rain',
          message,
          expect.any(String), // scheduledTime should be 24 hours before startTime
          'critical', // severe weather gets critical priority
        ])
      );
    });
  });

  describe('scheduleSchemeDeadlineAlert', () => {
    it('should schedule alerts at 7, 3, and 1 day before deadline', async () => {
      const userId = 'user123';
      const schemeId = 'scheme_789';
      const schemeName = 'PM-KISAN';
      const deadline = new Date(Date.now() + 86400000 * 10); // 10 days from now

      const alertIds = await alertScheduler.scheduleSchemeDeadlineAlert(
        userId,
        schemeId,
        schemeName,
        deadline
      );

      expect(alertIds).toHaveLength(3); // 7, 3, and 1 day alerts
      expect(mockDb.execute).toHaveBeenCalledTimes(3);
    });

    it('should skip alerts that would be scheduled in the past', async () => {
      const userId = 'user123';
      const schemeId = 'scheme_789';
      const schemeName = 'PM-KISAN';
      const deadline = new Date(Date.now() + 86400000 * 2); // 2 days from now

      const alertIds = await alertScheduler.scheduleSchemeDeadlineAlert(
        userId,
        schemeId,
        schemeName,
        deadline
      );

      // Should only schedule 1-day alert, as 7-day and 3-day would be in the past
      expect(alertIds.length).toBeLessThan(3);
    });
  });

  describe('getDueAlerts', () => {
    it('should fetch alerts that are due for delivery', async () => {
      const mockDueAlerts = [
        {
          id: 'alert_1',
          userId: 'user123',
          type: 'sowing',
          title: 'Sowing Reminder',
          message: 'Time to sow',
          scheduledTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          priority: 'high',
          status: 'scheduled',
          actionable: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];

      mockDb.query.mockResolvedValue(mockDueAlerts);

      const alerts = await alertScheduler.getDueAlerts();

      expect(alerts).toHaveLength(1);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE status = ?'),
        expect.arrayContaining(['scheduled', expect.any(String)])
      );
    });
  });

  describe('markAlertAsSent', () => {
    it('should update alert status to sent', async () => {
      const alertId = 'alert_123';

      await alertScheduler.markAlertAsSent(alertId);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE alerts SET status = ?'),
        expect.arrayContaining(['sent', expect.any(String), expect.any(String), alertId])
      );
    });
  });

  describe('markAlertAsRead', () => {
    it('should update alert status to read', async () => {
      const alertId = 'alert_123';

      await alertScheduler.markAlertAsRead(alertId);

      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE alerts SET status = ?'),
        expect.arrayContaining(['read', expect.any(String), alertId])
      );
    });
  });
});
