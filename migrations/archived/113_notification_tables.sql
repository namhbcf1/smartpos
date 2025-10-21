-- Notification Tables Migration
-- Based on RealTimeNotificationService.ts requirements

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT,
    type TEXT NOT NULL DEFAULT 'info',
    category TEXT NOT NULL DEFAULT 'system',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data_json TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    is_persistent INTEGER NOT NULL DEFAULT 1,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT NOT NULL,
    email_notifications INTEGER NOT NULL DEFAULT 1,
    push_notifications INTEGER NOT NULL DEFAULT 1,
    inventory_alerts INTEGER NOT NULL DEFAULT 1,
    sales_alerts INTEGER NOT NULL DEFAULT 1,
    system_alerts INTEGER NOT NULL DEFAULT 1,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Broadcast messages table
CREATE TABLE IF NOT EXISTS broadcast_messages (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    type TEXT NOT NULL,
    data_json TEXT NOT NULL,
    sender TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_tenant ON notification_preferences(tenant_id);

CREATE INDEX IF NOT EXISTS idx_broadcast_messages_tenant ON broadcast_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_type ON broadcast_messages(type);
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_created ON broadcast_messages(created_at);