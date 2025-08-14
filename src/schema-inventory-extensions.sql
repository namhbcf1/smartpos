-- ============================================================================
-- SMARTPOS INVENTORY FORECASTING SCHEMA EXTENSIONS
-- ============================================================================
-- This schema extends the unified schema with advanced inventory management
-- features including automated reorder points, demand forecasting, and
-- supplier performance tracking.
-- ============================================================================

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================================================
-- INVENTORY FORECASTING TABLES
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

-- Inventory movements (enhanced)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'transfer', 'return', 'damage', 'expired')),
  quantity_change INTEGER NOT NULL, -- Positive for increases, negative for decreases
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  unit_cost DECIMAL(12,2),
  reference_type TEXT, -- 'sale', 'purchase_order', 'adjustment', etc.
  reference_id INTEGER, -- ID of the related record
  batch_number TEXT,
  expiration_date DATE,
  location TEXT,
  reason TEXT,
  user_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE RESTRICT
);

-- Batch/Lot tracking
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
-- PERFORMANCE INDEXES FOR INVENTORY FORECASTING
-- ============================================================================

-- Inventory calculations indexes
CREATE INDEX IF NOT EXISTS idx_inventory_calculations_product_type ON inventory_calculations(product_id, calculation_type);
CREATE INDEX IF NOT EXISTS idx_inventory_calculations_date ON inventory_calculations(created_at DESC);

-- Demand forecasts indexes
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_product_date ON demand_forecasts(product_id, forecast_date DESC);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_accuracy ON demand_forecasts(accuracy_score DESC) WHERE accuracy_score IS NOT NULL;

-- Supplier performance indexes
CREATE INDEX IF NOT EXISTS idx_supplier_performance_supplier ON supplier_performance(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_performance_score ON supplier_performance(recommendation_score DESC);
CREATE INDEX IF NOT EXISTS idx_supplier_performance_period ON supplier_performance(evaluation_period_end DESC);

-- Purchase orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_date ON purchase_orders(supplier_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status_date ON purchase_orders(status, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_number ON purchase_orders(order_number);

-- Purchase order items indexes
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order ON purchase_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product ON purchase_order_items(product_id);

-- Inventory movements indexes
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_date ON inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type_date ON inventory_movements(movement_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id);

-- Product batches indexes
CREATE INDEX IF NOT EXISTS idx_product_batches_product ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiration ON product_batches(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_batches_status ON product_batches(status);

-- Reorder recommendations indexes
CREATE INDEX IF NOT EXISTS idx_reorder_recommendations_product ON reorder_recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_reorder_recommendations_urgency ON reorder_recommendations(urgency_level, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reorder_recommendations_status ON reorder_recommendations(status);

-- ============================================================================
-- TRIGGERS FOR AUTOMATED INVENTORY MANAGEMENT
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

-- Trigger to update batch quantity when sold
CREATE TRIGGER IF NOT EXISTS update_batch_on_sale
AFTER INSERT ON sale_items
BEGIN
  -- Update the oldest batch first (FIFO)
  UPDATE product_batches 
  SET 
    quantity_remaining = quantity_remaining - NEW.quantity,
    updated_at = datetime('now')
  WHERE product_id = NEW.product_id 
    AND quantity_remaining > 0 
    AND status = 'active'
  ORDER BY expiration_date ASC, created_at ASC
  LIMIT 1;
  
  -- Mark batch as sold out if quantity reaches zero
  UPDATE product_batches 
  SET status = 'sold_out'
  WHERE product_id = NEW.product_id 
    AND quantity_remaining <= 0 
    AND status = 'active';
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
-- VIEWS FOR INVENTORY ANALYTICS
-- ============================================================================

-- Inventory status view
CREATE VIEW IF NOT EXISTS inventory_status AS
SELECT 
  p.id,
  p.name,
  p.sku,
  p.stock_quantity,
  p.reorder_point,
  p.safety_stock,
  CASE 
    WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
    WHEN p.stock_quantity <= p.reorder_point THEN 'reorder_needed'
    WHEN p.stock_quantity <= p.safety_stock THEN 'low_stock'
    ELSE 'normal'
  END as stock_status,
  p.stock_quantity * p.cost_price as inventory_value,
  s.name as supplier_name,
  c.name as category_name
FROM products p
LEFT JOIN suppliers s ON p.supplier_id = s.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = 1;

-- Supplier performance summary view
CREATE VIEW IF NOT EXISTS supplier_performance_summary AS
SELECT 
  s.id,
  s.name,
  sp.recommendation_score,
  sp.average_lead_time,
  sp.on_time_deliveries * 100.0 / NULLIF(sp.total_orders, 0) as on_time_percentage,
  sp.quality_score,
  sp.price_competitiveness,
  COUNT(p.id) as products_supplied,
  sp.updated_at as last_evaluation
FROM suppliers s
LEFT JOIN supplier_performance sp ON s.id = sp.supplier_id
LEFT JOIN products p ON s.id = p.supplier_id AND p.is_active = 1
WHERE s.is_active = 1
GROUP BY s.id, s.name, sp.recommendation_score, sp.average_lead_time, 
         sp.on_time_deliveries, sp.total_orders, sp.quality_score, 
         sp.price_competitiveness, sp.updated_at;

-- ============================================================================
-- MIGRATION TRACKING
-- ============================================================================

-- Record this inventory extension as a migration
INSERT OR IGNORE INTO schema_migrations (id, name, version, execution_time_ms, checksum)
VALUES ('inventory_extensions_v1', 'Advanced inventory forecasting and management', 3, 0, 'inventory_extensions_checksum_v1');
