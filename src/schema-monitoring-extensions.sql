-- ============================================================================
-- SMARTPOS MONITORING & ALERTING SCHEMA EXTENSIONS
-- ============================================================================
-- This schema extends the unified schema with system monitoring, alerting,
-- and performance tracking capabilities.
-- ============================================================================

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================================================
-- MONITORING & ALERTING TABLES
-- ============================================================================

-- System alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value DECIMAL(12,4) NOT NULL,
  threshold DECIMAL(12,4) NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by INTEGER,
  acknowledged_at DATETIME,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
);

-- System metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('counter', 'gauge', 'histogram', 'timer')),
  value DECIMAL(12,4) NOT NULL,
  unit TEXT,
  tags TEXT, -- JSON object with metric tags
  timestamp DATETIME NOT NULL DEFAULT (datetime('now')),
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Performance baselines table
CREATE TABLE IF NOT EXISTS performance_baselines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL UNIQUE,
  baseline_value DECIMAL(12,4) NOT NULL,
  tolerance_percentage DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  unit TEXT,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Health check results table
CREATE TABLE IF NOT EXISTS health_check_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  check_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'unhealthy', 'degraded')),
  response_time INTEGER NOT NULL, -- in milliseconds
  details TEXT, -- JSON object with check details
  error_message TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Circuit breaker states table
CREATE TABLE IF NOT EXISTS circuit_breaker_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_name TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL CHECK (state IN ('CLOSED', 'OPEN', 'HALF_OPEN')),
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_failure_time DATETIME,
  half_open_calls INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Cache statistics table
CREATE TABLE IF NOT EXISTS cache_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_layer TEXT NOT NULL CHECK (cache_layer IN ('memory', 'kv', 'database')),
  hits INTEGER NOT NULL DEFAULT 0,
  misses INTEGER NOT NULL DEFAULT 0,
  sets INTEGER NOT NULL DEFAULT 0,
  deletes INTEGER NOT NULL DEFAULT 0,
  evictions INTEGER NOT NULL DEFAULT 0,
  total_size INTEGER NOT NULL DEFAULT 0,
  hit_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  memory_entries INTEGER DEFAULT 0,
  recorded_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Error tracking table
CREATE TABLE IF NOT EXISTS error_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  request_path TEXT,
  request_method TEXT,
  user_id INTEGER,
  session_id TEXT,
  user_agent TEXT,
  ip_address TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Performance logs table
CREATE TABLE IF NOT EXISTS performance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_name TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in milliseconds
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT,
  metadata TEXT, -- JSON object with additional data
  user_id INTEGER,
  session_id TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_configuration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  config_type TEXT NOT NULL CHECK (config_type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================================
-- PERFORMANCE INDEXES FOR MONITORING
-- ============================================================================

-- System alerts indexes
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity_created ON system_alerts(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_rule_created ON system_alerts(rule_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_acknowledged ON system_alerts(acknowledged, created_at DESC);

-- System metrics indexes
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_timestamp ON system_metrics(metric_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_type_timestamp ON system_metrics(metric_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_timestamp ON system_metrics(timestamp DESC);

-- Health check results indexes
CREATE INDEX IF NOT EXISTS idx_health_check_name_created ON health_check_results(check_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_check_status_created ON health_check_results(status, created_at DESC);

-- Circuit breaker states indexes
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_operation ON circuit_breaker_states(operation_name);
CREATE INDEX IF NOT EXISTS idx_circuit_breaker_state ON circuit_breaker_states(state);

-- Cache statistics indexes
CREATE INDEX IF NOT EXISTS idx_cache_stats_layer_recorded ON cache_statistics(cache_layer, recorded_at DESC);

-- Error tracking indexes
CREATE INDEX IF NOT EXISTS idx_error_tracking_type_created ON error_tracking(error_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_tracking_severity_created ON error_tracking(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_tracking_resolved ON error_tracking(resolved, created_at DESC);

-- Performance logs indexes
CREATE INDEX IF NOT EXISTS idx_performance_logs_operation_created ON performance_logs(operation_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_logs_duration ON performance_logs(duration DESC);
CREATE INDEX IF NOT EXISTS idx_performance_logs_success_created ON performance_logs(success, created_at DESC);

-- ============================================================================
-- TRIGGERS FOR MONITORING AUTOMATION
-- ============================================================================

-- Trigger to update circuit breaker state timestamp
CREATE TRIGGER IF NOT EXISTS update_circuit_breaker_timestamp
AFTER UPDATE ON circuit_breaker_states
BEGIN
  UPDATE circuit_breaker_states 
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;

-- Trigger to update system configuration timestamp
CREATE TRIGGER IF NOT EXISTS update_system_config_timestamp
AFTER UPDATE ON system_configuration
BEGIN
  UPDATE system_configuration 
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;

-- Trigger to update performance baseline timestamp
CREATE TRIGGER IF NOT EXISTS update_performance_baseline_timestamp
AFTER UPDATE ON performance_baselines
BEGIN
  UPDATE performance_baselines 
  SET updated_at = datetime('now')
  WHERE id = NEW.id;
END;

-- ============================================================================
-- VIEWS FOR MONITORING ANALYTICS
-- ============================================================================

-- Alert summary view
CREATE VIEW IF NOT EXISTS alert_summary AS
SELECT 
  severity,
  COUNT(*) as alert_count,
  COUNT(CASE WHEN acknowledged = 1 THEN 1 END) as acknowledged_count,
  COUNT(CASE WHEN resolved = 1 THEN 1 END) as resolved_count,
  MAX(created_at) as latest_alert
FROM system_alerts
WHERE created_at >= datetime('now', '-24 hours')
GROUP BY severity;

-- Performance summary view
CREATE VIEW IF NOT EXISTS performance_summary AS
SELECT 
  operation_name,
  COUNT(*) as total_operations,
  AVG(duration) as avg_duration,
  MIN(duration) as min_duration,
  MAX(duration) as max_duration,
  COUNT(CASE WHEN success = 1 THEN 1 END) as success_count,
  COUNT(CASE WHEN success = 0 THEN 1 END) as error_count,
  (COUNT(CASE WHEN success = 1 THEN 1 END) * 100.0 / COUNT(*)) as success_rate
FROM performance_logs
WHERE created_at >= datetime('now', '-24 hours')
GROUP BY operation_name;

-- Error summary view
CREATE VIEW IF NOT EXISTS error_summary AS
SELECT 
  error_type,
  severity,
  COUNT(*) as error_count,
  COUNT(CASE WHEN resolved = 1 THEN 1 END) as resolved_count,
  MAX(created_at) as latest_occurrence,
  COUNT(DISTINCT user_id) as affected_users
FROM error_tracking
WHERE created_at >= datetime('now', '-24 hours')
GROUP BY error_type, severity;

-- ============================================================================
-- DEFAULT SYSTEM CONFIGURATION
-- ============================================================================

-- Insert default monitoring configuration
INSERT OR IGNORE INTO system_configuration (config_key, config_value, config_type, description) VALUES
('monitoring.enabled', 'true', 'boolean', 'Enable system monitoring'),
('monitoring.metrics_retention_days', '30', 'number', 'Number of days to retain metrics data'),
('monitoring.alert_cooldown_minutes', '10', 'number', 'Default alert cooldown period in minutes'),
('monitoring.health_check_interval_seconds', '60', 'number', 'Health check interval in seconds'),
('monitoring.performance_baseline_tolerance', '20', 'number', 'Default performance baseline tolerance percentage'),
('cache.default_ttl_seconds', '3600', 'number', 'Default cache TTL in seconds'),
('cache.max_memory_entries', '1000', 'number', 'Maximum entries in memory cache'),
('circuit_breaker.failure_threshold', '5', 'number', 'Default circuit breaker failure threshold'),
('circuit_breaker.recovery_timeout_seconds', '60', 'number', 'Default circuit breaker recovery timeout'),
('error_tracking.enabled', 'true', 'boolean', 'Enable error tracking'),
('error_tracking.retention_days', '90', 'number', 'Number of days to retain error logs');

-- Insert default performance baselines
INSERT OR IGNORE INTO performance_baselines (metric_name, baseline_value, tolerance_percentage, unit, description) VALUES
('api.response_time', 200.0, 20.0, 'ms', 'API response time baseline'),
('database.query_time', 50.0, 30.0, 'ms', 'Database query time baseline'),
('cache.hit_rate', 85.0, 10.0, '%', 'Cache hit rate baseline'),
('api.error_rate', 1.0, 50.0, '%', 'API error rate baseline'),
('memory.usage', 512.0, 25.0, 'MB', 'Memory usage baseline'),
('cpu.usage', 70.0, 15.0, '%', 'CPU usage baseline');

-- ============================================================================
-- MIGRATION TRACKING
-- ============================================================================

-- Record this monitoring extension as a migration
INSERT OR IGNORE INTO schema_migrations (id, name, version, execution_time_ms, checksum)
VALUES ('monitoring_extensions_v1', 'System monitoring and alerting capabilities', 4, 0, 'monitoring_extensions_checksum_v1');
