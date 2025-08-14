-- ============================================================================
-- SMARTPOS ADVANCED FEATURES COMPLETE MIGRATION
-- ============================================================================
-- This migration applies all advanced features schema extensions in the
-- correct order for production deployment.
-- ============================================================================

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================================================
-- INVENTORY FORECASTING EXTENSIONS
-- ============================================================================

-- Inventory calculations log
CREATE TABLE IF NOT EXISTS inventory_calculations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  calculation_type TEXT NOT NULL CHECK (calculation_type IN ('reorder_point', 'demand_forecast', 'safety_stock', 'eoq')),
  calculated_value DECIMAL(12,2) NOT NULL,
  parameters TEXT, -- JSON object with calculation parameters
  confidence_score DECIMAL(3,2) DEFAULT 0.85,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Demand forecasting results
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  forecast_period_days INTEGER NOT NULL DEFAULT 30,
  predicted_demand DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.85,
  seasonality_factor DECIMAL(5,4) NOT NULL DEFAULT 1.0000,
  trend_factor DECIMAL(5,4) NOT NULL DEFAULT 1.0000,
  historical_accuracy DECIMAL(3,2) DEFAULT 0.85,
  forecast_date DATETIME NOT NULL DEFAULT (datetime('now')),
  actual_demand DECIMAL(12,2), -- Filled in after forecast period
  accuracy_score DECIMAL(3,2), -- Calculated after actual demand is known
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Supplier performance tracking
CREATE TABLE IF NOT EXISTS supplier_performance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL,
  evaluation_period_start DATE NOT NULL,
  evaluation_period_end DATE NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 0,
  on_time_deliveries INTEGER NOT NULL DEFAULT 0,
  average_lead_time DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- in days
  quality_score DECIMAL(3,2) NOT NULL DEFAULT 0.85,
  price_competitiveness DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  recommendation_score DECIMAL(3,2) NOT NULL DEFAULT 0.50,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  supplier_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL DEFAULT 1,
  order_date DATE NOT NULL DEFAULT (date('now')),
  expected_date DATE,
  received_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'partial', 'received', 'cancelled')),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  shipping_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  quality_score DECIMAL(3,2) DEFAULT 0.85, -- Filled after receiving
  notes TEXT,
  created_by INTEGER NOT NULL,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Purchase order items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(12,2) NOT NULL CHECK (unit_cost >= 0),
  received_quantity INTEGER DEFAULT 0 CHECK (received_quantity >= 0),
  total_cost DECIMAL(12,2) NOT NULL CHECK (total_cost >= 0),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Product batches for lot tracking
CREATE TABLE IF NOT EXISTS product_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  batch_number TEXT NOT NULL,
  supplier_id INTEGER,
  purchase_order_id INTEGER,
  quantity_received INTEGER NOT NULL CHECK (quantity_received > 0),
  quantity_remaining INTEGER NOT NULL CHECK (quantity_remaining >= 0),
  unit_cost DECIMAL(12,2) NOT NULL CHECK (unit_cost >= 0),
  manufacturing_date DATE,
  expiration_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'recalled', 'sold_out')),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE SET NULL,
  UNIQUE(product_id, batch_number)
);

-- Reorder recommendations
CREATE TABLE IF NOT EXISTS reorder_recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  current_stock INTEGER NOT NULL,
  reorder_level INTEGER NOT NULL,
  recommended_quantity INTEGER NOT NULL,
  preferred_supplier_id INTEGER,
  estimated_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  urgency_level TEXT NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high', 'critical')),
  reason_code TEXT NOT NULL,
  expected_delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'ignored', 'expired')),
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  expires_at DATETIME NOT NULL DEFAULT (datetime('now', '+7 days')),
  processed_at DATETIME,
  processed_by INTEGER,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (preferred_supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- MONITORING & ALERTING EXTENSIONS
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

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Inventory forecasting indexes
CREATE INDEX IF NOT EXISTS idx_inventory_calculations_product_type ON inventory_calculations(product_id, calculation_type);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_product_date ON demand_forecasts(product_id, forecast_date DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_performance_supplier ON supplier_performance(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_date ON purchase_orders(supplier_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_product_batches_product ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_reorder_recommendations_urgency ON reorder_recommendations(urgency_level, created_at DESC);

-- Monitoring indexes
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity_created ON system_alerts(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_metrics_name_timestamp ON system_metrics(metric_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_check_name_created ON health_check_results(check_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_tracking_type_created ON error_tracking(error_type, created_at DESC);

-- ============================================================================
-- TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Trigger to update product stock when inventory movement is recorded
CREATE TRIGGER IF NOT EXISTS update_stock_on_movement
AFTER INSERT ON inventory_movements
BEGIN
  UPDATE products 
  SET 
    stock_quantity = NEW.quantity_after,
    updated_at = datetime('now')
  WHERE id = NEW.product_id;
END;

-- Trigger to create reorder recommendation when stock is low
CREATE TRIGGER IF NOT EXISTS check_reorder_point
AFTER UPDATE OF stock_quantity ON products
WHEN NEW.stock_quantity <= NEW.reorder_point AND NEW.reorder_point > 0
BEGIN
  INSERT OR IGNORE INTO reorder_recommendations (
    product_id,
    current_stock,
    reorder_level,
    recommended_quantity,
    preferred_supplier_id,
    estimated_cost,
    urgency_level,
    reason_code,
    expected_delivery_date
  )
  VALUES (
    NEW.id,
    NEW.stock_quantity,
    NEW.reorder_point,
    COALESCE(NEW.reorder_quantity, NEW.reorder_point * 2),
    NEW.supplier_id,
    COALESCE(NEW.reorder_quantity, NEW.reorder_point * 2) * NEW.cost_price,
    CASE 
      WHEN NEW.stock_quantity <= 0 THEN 'critical'
      WHEN NEW.stock_quantity <= NEW.reorder_point * 0.5 THEN 'high'
      WHEN NEW.stock_quantity <= NEW.reorder_point * 0.8 THEN 'medium'
      ELSE 'low'
    END,
    CASE 
      WHEN NEW.stock_quantity <= 0 THEN 'OUT_OF_STOCK'
      WHEN NEW.stock_quantity <= NEW.reorder_point * 0.5 THEN 'CRITICALLY_LOW_STOCK'
      ELSE 'LOW_STOCK'
    END,
    date('now', '+7 days')
  );
END;

-- ============================================================================
-- DEFAULT CONFIGURATION DATA
-- ============================================================================

-- Insert default performance baselines
INSERT OR IGNORE INTO performance_baselines (metric_name, baseline_value, tolerance_percentage, unit, description) VALUES
('api.response_time', 200.0, 20.0, 'ms', 'API response time baseline'),
('database.query_time', 50.0, 30.0, 'ms', 'Database query time baseline'),
('cache.hit_rate', 85.0, 10.0, '%', 'Cache hit rate baseline'),
('api.error_rate', 1.0, 50.0, '%', 'API error rate baseline');

-- ============================================================================
-- MIGRATION TRACKING
-- ============================================================================

-- Record this advanced features migration
INSERT OR IGNORE INTO schema_migrations (id, name, version, execution_time_ms, checksum)
VALUES ('advanced_features_v1', 'Complete advanced features migration', 5, 0, 'advanced_features_checksum_v1');
