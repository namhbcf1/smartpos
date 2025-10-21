-- Create notification_service table for notification management
CREATE TABLE IF NOT EXISTS notification_service (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'default',
  notification_type TEXT NOT NULL,
  notification_data TEXT, -- JSON data
  target_user_id TEXT,
  target_tenant_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  created_at TEXT DEFAULT datetime('now'),
  sent_at TEXT,
  failed_at TEXT,
  error_message TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_service_tenant ON notification_service(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_service_type ON notification_service(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_service_target_user ON notification_service(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notification_service_status ON notification_service(status);