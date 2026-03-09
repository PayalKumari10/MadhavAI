/**
 * Alert System Database Schema
 * SQLite schema for local alert storage
 */

export const ALERT_SCHEMA = `
  -- Alerts table
  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduledTime TEXT NOT NULL,
    sentTime TEXT,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    actionable INTEGER NOT NULL DEFAULT 0,
    actionUrl TEXT,
    metadata TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  -- Alert templates table
  CREATE TABLE IF NOT EXISTS alert_templates (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    titleTemplate TEXT NOT NULL,
    messageTemplate TEXT NOT NULL,
    priority TEXT NOT NULL,
    actionable INTEGER NOT NULL DEFAULT 0,
    translations TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  -- Alert preferences table
  CREATE TABLE IF NOT EXISTS alert_preferences (
    userId TEXT PRIMARY KEY,
    enableSMS INTEGER NOT NULL DEFAULT 1,
    enablePushNotifications INTEGER NOT NULL DEFAULT 1,
    enableVoiceNotifications INTEGER NOT NULL DEFAULT 1,
    quietHoursEnabled INTEGER NOT NULL DEFAULT 0,
    quietHoursStart TEXT,
    quietHoursEnd TEXT,
    alertTypeSowing INTEGER NOT NULL DEFAULT 1,
    alertTypeFertilizer INTEGER NOT NULL DEFAULT 1,
    alertTypeIrrigation INTEGER NOT NULL DEFAULT 1,
    alertTypePestControl INTEGER NOT NULL DEFAULT 1,
    alertTypeHarvest INTEGER NOT NULL DEFAULT 1,
    alertTypeWeather INTEGER NOT NULL DEFAULT 1,
    alertTypeScheme INTEGER NOT NULL DEFAULT 1,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  -- Notification delivery records table
  CREATE TABLE IF NOT EXISTS notification_deliveries (
    id TEXT PRIMARY KEY,
    alertId TEXT NOT NULL,
    userId TEXT NOT NULL,
    channel TEXT NOT NULL,
    status TEXT NOT NULL,
    sentAt TEXT,
    deliveredAt TEXT,
    failureReason TEXT,
    retryCount INTEGER NOT NULL DEFAULT 0,
    metadata TEXT,
    FOREIGN KEY (alertId) REFERENCES alerts(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_alerts_userId ON alerts(userId);
  CREATE INDEX IF NOT EXISTS idx_alerts_scheduledTime ON alerts(scheduledTime);
  CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
  CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
  CREATE INDEX IF NOT EXISTS idx_notification_deliveries_alertId ON notification_deliveries(alertId);
  CREATE INDEX IF NOT EXISTS idx_notification_deliveries_userId ON notification_deliveries(userId);
`;

/**
 * Initialize alert tables in the database
 */
export async function initializeAlertSchema(db: any): Promise<void> {
  const statements = ALERT_SCHEMA.split(';').filter((s) => s.trim());

  for (const statement of statements) {
    if (statement.trim()) {
      await db.execute(statement);
    }
  }
}
