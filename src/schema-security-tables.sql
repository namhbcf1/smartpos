-- SECURITY ENHANCEMENT TABLES
-- Additional tables for comprehensive security and audit features

-- User permissions table for granular access control
CREATE TABLE IF NOT EXISTS user_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  conditions TEXT, -- JSON string for conditions
  granted_by INTEGER NOT NULL,
  granted_at DATETIME NOT NULL DEFAULT (datetime('now')),
  revoked_at DATETIME,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE(user_id, resource, action)
);

-- Permission audit log
CREATE TABLE IF NOT EXISTS permission_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  success INTEGER NOT NULL CHECK (success IN (0, 1)),
  details TEXT, -- JSON string
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Comprehensive audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL DEFAULT 0,
  username TEXT NOT NULL,
  role TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values TEXT, -- JSON string
  new_values TEXT, -- JSON string
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  success INTEGER NOT NULL CHECK (success IN (0, 1)),
  error_message TEXT,
  metadata TEXT, -- JSON string
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Security events log
CREATE TABLE IF NOT EXISTS security_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL, -- 'login_attempt', 'permission_denied', 'suspicious_activity', etc.
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id INTEGER,
  username TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details TEXT, -- JSON string
  resolved INTEGER NOT NULL DEFAULT 0 CHECK (resolved IN (0, 1)),
  resolved_by INTEGER,
  resolved_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Session management table
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  last_activity DATETIME NOT NULL DEFAULT (datetime('now')),
  expires_at DATETIME NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  requests_count INTEGER NOT NULL DEFAULT 1,
  window_start DATETIME NOT NULL DEFAULT (datetime('now')),
  blocked INTEGER NOT NULL DEFAULT 0 CHECK (blocked IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  attempt_time DATETIME NOT NULL DEFAULT (datetime('now')),
  reason TEXT -- 'invalid_password', 'user_not_found', 'account_locked', etc.
);

-- Password history for preventing reuse
CREATE TABLE IF NOT EXISTS password_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Two-factor authentication
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  secret_key TEXT NOT NULL,
  backup_codes TEXT, -- JSON array of backup codes
  is_enabled INTEGER NOT NULL DEFAULT 0 CHECK (is_enabled IN (0, 1)),
  last_used DATETIME,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API keys for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  permissions TEXT, -- JSON array of permissions
  last_used DATETIME,
  expires_at DATETIME,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User permissions indexes
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource ON user_permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(is_active);

-- Permission audit log indexes
CREATE INDEX IF NOT EXISTS idx_permission_audit_user_id ON permission_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_created_at ON permission_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_permission_audit_resource ON permission_audit_log(resource, action);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_success ON audit_log(success);

-- Security events indexes
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);

-- Session management indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- Rate limiting indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint ON rate_limit_log(ip_address, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window_start ON rate_limit_log(window_start);

-- Failed login attempts indexes
CREATE INDEX IF NOT EXISTS idx_failed_login_username ON failed_login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_time ON failed_login_attempts(attempt_time);

-- Password history indexes
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_created_at ON password_history(created_at);

-- Two-factor auth indexes
CREATE INDEX IF NOT EXISTS idx_two_factor_user_id ON two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_enabled ON two_factor_auth(is_enabled);

-- API keys indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC AUDIT LOGGING
-- ============================================================================

-- Trigger for user table changes
CREATE TRIGGER IF NOT EXISTS audit_users_changes
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  INSERT INTO audit_log (
    user_id, username, role, action, resource_type, resource_id,
    old_values, new_values, success, created_at
  ) VALUES (
    NEW.id, NEW.username, NEW.role, 'update', 'user', NEW.id,
    json_object(
      'username', OLD.username,
      'email', OLD.email,
      'role', OLD.role,
      'is_active', OLD.is_active
    ),
    json_object(
      'username', NEW.username,
      'email', NEW.email,
      'role', NEW.role,
      'is_active', NEW.is_active
    ),
    1, datetime('now')
  );
END;

-- Trigger for product price changes
CREATE TRIGGER IF NOT EXISTS audit_product_price_changes
AFTER UPDATE OF price, cost_price ON products
FOR EACH ROW
WHEN OLD.price != NEW.price OR OLD.cost_price != NEW.cost_price
BEGIN
  INSERT INTO audit_log (
    user_id, username, role, action, resource_type, resource_id,
    old_values, new_values, success, created_at
  ) VALUES (
    0, 'system', 'system', 'price_change', 'product', NEW.id,
    json_object('price', OLD.price, 'cost_price', OLD.cost_price),
    json_object('price', NEW.price, 'cost_price', NEW.cost_price),
    1, datetime('now')
  );
END;

-- Trigger for inventory changes
CREATE TRIGGER IF NOT EXISTS audit_inventory_changes
AFTER UPDATE OF stock_quantity ON products
FOR EACH ROW
WHEN OLD.stock_quantity != NEW.stock_quantity
BEGIN
  INSERT INTO audit_log (
    user_id, username, role, action, resource_type, resource_id,
    old_values, new_values, success, created_at
  ) VALUES (
    0, 'system', 'system', 'inventory_adjust', 'product', NEW.id,
    json_object('stock_quantity', OLD.stock_quantity),
    json_object('stock_quantity', NEW.stock_quantity),
    1, datetime('now')
  );
END;

-- ============================================================================
-- VIEWS FOR SECURITY REPORTING
-- ============================================================================

-- Security dashboard view
CREATE VIEW IF NOT EXISTS security_dashboard AS
SELECT 
  'failed_logins' as metric,
  COUNT(*) as value,
  'last_24h' as period
FROM failed_login_attempts 
WHERE attempt_time > datetime('now', '-24 hours')

UNION ALL

SELECT 
  'security_events' as metric,
  COUNT(*) as value,
  'last_24h' as period
FROM security_events 
WHERE created_at > datetime('now', '-24 hours')

UNION ALL

SELECT 
  'active_sessions' as metric,
  COUNT(*) as value,
  'current' as period
FROM user_sessions 
WHERE is_active = 1 AND expires_at > datetime('now')

UNION ALL

SELECT 
  'permission_denials' as metric,
  COUNT(*) as value,
  'last_24h' as period
FROM permission_audit_log 
WHERE success = 0 AND created_at > datetime('now', '-24 hours');

-- User activity summary view
CREATE VIEW IF NOT EXISTS user_activity_summary AS
SELECT 
  u.id,
  u.username,
  u.role,
  COUNT(al.id) as total_actions,
  COUNT(CASE WHEN al.success = 0 THEN 1 END) as failed_actions,
  MAX(al.created_at) as last_activity,
  COUNT(CASE WHEN al.created_at > datetime('now', '-24 hours') THEN 1 END) as actions_last_24h
FROM users u
LEFT JOIN audit_log al ON u.id = al.user_id
WHERE u.is_active = 1
GROUP BY u.id, u.username, u.role;
