-- Create realtime_events table for real-time notifications
CREATE TABLE IF NOT EXISTS realtime_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'default',
  event_type TEXT NOT NULL,
  event_data TEXT, -- JSON data
  target_user_id TEXT,
  target_tenant_id TEXT,
  created_at TEXT DEFAULT datetime('now'),
  expires_at TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_realtime_events_tenant ON realtime_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_realtime_events_type ON realtime_events(event_type);
CREATE INDEX IF NOT EXISTS idx_realtime_events_target_user ON realtime_events(target_user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_events_expires ON realtime_events(expires_at);