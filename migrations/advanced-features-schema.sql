-- ==========================================
-- ADVANCED FEATURES DATABASE SCHEMA
-- AI, Mobile, IoT, Voice Commands
-- ==========================================

-- ==========================================
-- AI & ANALYTICS TABLES
-- ==========================================

-- AI insights and predictions
CREATE TABLE IF NOT EXISTS ai_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('prediction', 'recommendation', 'alert', 'optimization')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score REAL NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  category TEXT NOT NULL, -- 'inventory', 'sales', 'warranty', 'customer'
  data_source TEXT NOT NULL, -- JSON with source data
  ai_model_version TEXT DEFAULT 'v1.0',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  resolved_at DATETIME
);

-- AI predictions tracking
CREATE TABLE IF NOT EXISTS ai_predictions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prediction_type TEXT NOT NULL, -- 'sales_forecast', 'warranty_claims', 'inventory_needs'
  target_date DATE NOT NULL,
  predicted_value REAL NOT NULL,
  actual_value REAL,
  confidence_score REAL NOT NULL,
  model_version TEXT DEFAULT 'v1.0',
  input_data TEXT NOT NULL, -- JSON with input parameters
  accuracy_score REAL, -- Calculated after actual value is known
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  evaluated_at DATETIME
);

-- ==========================================
-- NOTIFICATION SYSTEM
-- ==========================================

-- Smart notifications and alerts
CREATE TABLE IF NOT EXISTS notification_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  user_id TEXT,
  serial_number TEXT,
  notification_type TEXT NOT NULL, -- 'warranty_expiring', 'claim_update', 'promotion', 'ai_alert'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'push', 'in_app')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  metadata TEXT DEFAULT '{}', -- JSON with additional data
  sent_at DATETIME,
  delivered_at DATETIME,
  read_at DATETIME,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (serial_number) REFERENCES serial_numbers(serial_number)
);

-- ==========================================
-- VOICE COMMANDS & AI INTERACTIONS
-- ==========================================

-- Voice command logs
CREATE TABLE IF NOT EXISTS voice_commands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  command_text TEXT NOT NULL,
  intent TEXT, -- 'add_product', 'checkout', 'search', 'status_check'
  confidence_score REAL,
  response_text TEXT,
  action_taken TEXT, -- JSON with actions performed
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT 0,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- MOBILE & PWA FEATURES
-- ==========================================

-- Mobile device registrations for push notifications
CREATE TABLE IF NOT EXISTS mobile_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL CHECK (device_type IN ('ios', 'android', 'web')),
  push_token TEXT,
  device_name TEXT,
  app_version TEXT,
  os_version TEXT,
  last_active DATETIME,
  push_enabled BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Offline sync queue for mobile
CREATE TABLE IF NOT EXISTS offline_sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete'
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON data
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed', 'conflict')),
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  synced_at DATETIME,
  FOREIGN KEY (device_id) REFERENCES mobile_devices(device_id)
);

-- ==========================================
-- IOT & SMART INVENTORY
-- ==========================================

-- IoT sensors for smart inventory management
CREATE TABLE IF NOT EXISTS iot_sensors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT NOT NULL UNIQUE,
  sensor_type TEXT NOT NULL CHECK (sensor_type IN ('weight', 'rfid', 'temperature', 'humidity', 'motion')),
  location TEXT NOT NULL, -- Store location or shelf
  product_id INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'error')),
  last_reading REAL,
  last_reading_time DATETIME,
  battery_level INTEGER, -- Percentage
  firmware_version TEXT,
  configuration TEXT DEFAULT '{}', -- JSON configuration
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- IoT sensor readings
CREATE TABLE IF NOT EXISTS iot_sensor_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor_id TEXT NOT NULL,
  reading_type TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT, -- 'kg', 'celsius', 'percent', etc.
  quality_score REAL DEFAULT 100, -- Data quality score
  anomaly_detected BOOLEAN DEFAULT 0,
  metadata TEXT DEFAULT '{}', -- JSON with additional data
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sensor_id) REFERENCES iot_sensors(sensor_id)
);

-- ==========================================
-- ADVANCED WARRANTY FEATURES
-- ==========================================

-- Warranty claim logs for detailed tracking
CREATE TABLE IF NOT EXISTS warranty_claim_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'approved', 'rejected', 'completed'
  description TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  attachments TEXT, -- JSON array of file URLs
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (claim_id) REFERENCES warranty_claims(id)
);

-- Extended warranty offerings
CREATE TABLE IF NOT EXISTS extended_warranties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial_number_id INTEGER NOT NULL,
  original_warranty_id INTEGER NOT NULL,
  extended_months INTEGER NOT NULL,
  cost DECIMAL(15,2) NOT NULL,
  new_end_date DATE NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  terms_conditions TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id),
  FOREIGN KEY (original_warranty_id) REFERENCES warranty_registrations(id)
);

-- ==========================================
-- PERFORMANCE & ANALYTICS
-- ==========================================

-- System performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_type TEXT NOT NULL, -- 'api_response_time', 'db_query_time', 'user_action'
  metric_name TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT, -- 'ms', 'seconds', 'count'
  tags TEXT DEFAULT '{}', -- JSON with additional tags
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User activity analytics
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT, -- Table or endpoint accessed
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  duration_ms INTEGER,
  success BOOLEAN DEFAULT 1,
  error_message TEXT,
  metadata TEXT DEFAULT '{}', -- JSON with additional data
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================



-- AI & Analytics indexes
CREATE INDEX IF NOT EXISTS idx_ai_insights_type_status ON ai_insights(insight_type, status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created ON ai_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_type_date ON ai_predictions(prediction_type, target_date);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notification_logs_customer ON notification_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at);

-- Voice command indexes
CREATE INDEX IF NOT EXISTS idx_voice_commands_user ON voice_commands(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_created ON voice_commands(created_at);

-- Mobile device indexes
CREATE INDEX IF NOT EXISTS idx_mobile_devices_user ON mobile_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_active ON mobile_devices(last_active);

-- IoT sensor indexes
CREATE INDEX IF NOT EXISTS idx_iot_sensors_type ON iot_sensors(sensor_type);
CREATE INDEX IF NOT EXISTS idx_iot_sensors_location ON iot_sensors(location);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_readings_sensor ON iot_sensor_readings(sensor_id);
CREATE INDEX IF NOT EXISTS idx_iot_sensor_readings_timestamp ON iot_sensor_readings(timestamp);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_timestamp ON user_activity_logs(timestamp);

-- ==========================================
-- VIEWS FOR ADVANCED ANALYTICS
-- ==========================================

-- Comprehensive serial number tracking
CREATE VIEW IF NOT EXISTS v_serial_number_complete AS
SELECT 
  sn.id,
  sn.serial_number,
  sn.status,
  sn.received_date,
  sn.sold_date,
  sn.warranty_start_date,
  sn.warranty_end_date,
  
  -- Product info
  p.name as product_name,
  p.sku as product_sku,
  p.warranty_period_months,
  
  -- Stock in info
  si.reference_number as stock_in_reference,
  si.created_at as stock_in_date,
  sup.name as supplier_name,
  
  -- Sale info
  s.receipt_number,
  s.created_at as sale_date,
  c.full_name as customer_name,
  c.phone as customer_phone,
  
  -- Warranty info
  wr.warranty_number,
  wr.warranty_type,
  wr.status as warranty_status,
  
  -- Warranty claims
  COUNT(wc.id) as claim_count,
  MAX(wc.status) as latest_claim_status,
  

  
  -- AI insights
  COUNT(ai.id) as ai_insights_count,
  MAX(ai.confidence_score) as max_ai_confidence
  
FROM serial_numbers sn
LEFT JOIN products p ON sn.product_id = p.id
LEFT JOIN stock_ins si ON sn.stock_in_id = si.id
LEFT JOIN suppliers sup ON si.supplier_id = sup.id
LEFT JOIN sales s ON sn.sale_id = s.id
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN warranty_registrations wr ON sn.id = wr.serial_number_id
LEFT JOIN warranty_claims wc ON wr.id = wc.warranty_registration_id
LEFT JOIN ai_insights ai ON ai.data_source LIKE '%' || sn.serial_number || '%'
GROUP BY sn.id;

-- AI-powered dashboard metrics
CREATE VIEW IF NOT EXISTS v_ai_dashboard_metrics AS
SELECT 
  -- Real-time counts
  COUNT(DISTINCT sn.id) as total_active_serials,
  COUNT(DISTINCT CASE WHEN sn.created_at >= datetime('now', '-24 hours') THEN sn.id END) as new_serials_24h,
  COUNT(DISTINCT CASE WHEN sn.sold_date >= datetime('now', '-24 hours') THEN sn.id END) as sold_24h,
  COUNT(DISTINCT CASE WHEN sn.status = 'warranty_claim' THEN sn.id END) as active_claims,
  
  -- Performance metrics
  AVG(CASE WHEN sn.sold_date IS NOT NULL THEN 
    julianday(sn.sold_date) - julianday(sn.received_date) 
  END) as avg_inventory_days,
  
  -- Warranty metrics
  COUNT(CASE WHEN sn.warranty_end_date <= datetime('now', '+7 days') AND sn.warranty_end_date > datetime('now') THEN 1 END) as urgent_warranties,
  COUNT(CASE WHEN sn.warranty_end_date <= datetime('now', '+30 days') AND sn.warranty_end_date > datetime('now') THEN 1 END) as expiring_soon,
  

  
  -- AI metrics
  COUNT(DISTINCT ai.id) as active_ai_insights,
  AVG(ai.confidence_score) as avg_ai_confidence,
  
  -- Quality metrics
  COUNT(CASE WHEN sn.status = 'warranty_claim' THEN 1 END) * 100.0 / 
    NULLIF(COUNT(CASE WHEN sn.status = 'sold' THEN 1 END), 0) as warranty_claim_rate,
    
  -- System health score (calculated)
  CASE 
    WHEN COUNT(CASE WHEN sn.status = 'warranty_claim' THEN 1 END) * 100.0 / 
         NULLIF(COUNT(CASE WHEN sn.status = 'sold' THEN 1 END), 0) < 5 THEN 95
    WHEN COUNT(CASE WHEN sn.status = 'warranty_claim' THEN 1 END) * 100.0 / 
         NULLIF(COUNT(CASE WHEN sn.status = 'sold' THEN 1 END), 0) < 10 THEN 85
    ELSE 75
  END as ai_health_score

FROM serial_numbers sn
LEFT JOIN ai_insights ai ON ai.status = 'active';

-- ==========================================
-- TRIGGERS FOR AUTOMATION
-- ==========================================

-- Auto-create AI insights when warranty claims exceed threshold
CREATE TRIGGER IF NOT EXISTS auto_create_warranty_insight
AFTER INSERT ON warranty_claims
BEGIN
  INSERT INTO ai_insights (
    insight_type, title, description, confidence_score, priority, category, data_source
  )
  SELECT 
    'alert',
    'High Warranty Claim Rate Detected',
    'Product ' || p.name || ' has exceeded normal warranty claim rate',
    85.0,
    'high',
    'warranty',
    json_object('product_id', p.id, 'claim_count', claim_count)
  FROM (
    SELECT 
      wr.product_id,
      COUNT(*) as claim_count
    FROM warranty_claims wc
    JOIN warranty_registrations wr ON wc.warranty_registration_id = wr.id
    WHERE wr.product_id = (
      SELECT wr2.product_id 
      FROM warranty_registrations wr2 
      WHERE wr2.id = NEW.warranty_registration_id
    )
    GROUP BY wr.product_id
    HAVING COUNT(*) > 5
  ) claim_stats
  JOIN products p ON claim_stats.product_id = p.id
  WHERE NOT EXISTS (
    SELECT 1 FROM ai_insights 
    WHERE category = 'warranty' 
    AND data_source LIKE '%"product_id":' || claim_stats.product_id || '%'
    AND status = 'active'
  );
END;

-- Auto-update performance metrics
CREATE TRIGGER IF NOT EXISTS track_user_activity
AFTER INSERT ON user_activity_logs
BEGIN
  INSERT INTO performance_metrics (metric_type, metric_name, value, unit)
  VALUES ('user_activity', 'action_count', 1, 'count');
END;
