-- Create realtime_event_broadcaster table for real-time event broadcasting
CREATE TABLE IF NOT EXISTS realtime_event_broadcaster (
  id TEXT PRIMARY KEY,
  tenant_id TEXT DEFAULT 'default',
  event_type TEXT NOT NULL,
  event_data TEXT, -- JSON data
  target_audience TEXT, -- 'all', 'tenant', 'user', 'role'
  target_value TEXT, -- specific tenant, user, or role
  created_at TEXT DEFAULT datetime('now'),
  expires_at TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_realtime_event_broadcaster_tenant ON realtime_event_broadcaster(tenant_id);
CREATE INDEX IF NOT EXISTS idx_realtime_event_broadcaster_type ON realtime_event_broadcaster(event_type);
CREATE INDEX IF NOT EXISTS idx_realtime_event_broadcaster_audience ON realtime_event_broadcaster(target_audience);
CREATE INDEX IF NOT EXISTS idx_realtime_event_broadcaster_expires ON realtime_event_broadcaster(expires_at);