-- Migration: 128_create_promotions_table.sql
-- Create promotions table for promotion management

CREATE TABLE IF NOT EXISTS promotions (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'percentage',
    value DECIMAL(15,2) NOT NULL DEFAULT 0,
    min_purchase DECIMAL(15,2) DEFAULT 0,
    max_discount DECIMAL(15,2),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, code)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotions_tenant_id ON promotions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_promotions_code ON promotions (code);
CREATE INDEX IF NOT EXISTS idx_promotions_name ON promotions (name);
CREATE INDEX IF NOT EXISTS idx_promotions_type ON promotions (type);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions (is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_start_date ON promotions (start_date);
CREATE INDEX IF NOT EXISTS idx_promotions_end_date ON promotions (end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_created_at ON promotions (created_at);

-- Insert sample data
INSERT OR IGNORE INTO promotions (
    id, tenant_id, code, name, description, type, value, 
    min_purchase, max_discount, start_date, end_date, is_active
) VALUES 
(
    'promo_001', 'default', 'WELCOME10', 'Chào mừng khách hàng mới', 
    'Giảm giá 10% cho đơn hàng đầu tiên', 'percentage', 10.00,
    100000, 50000, '2024-01-01', '2024-12-31', 1
),
(
    'promo_002', 'default', 'SAVE50K', 'Tiết kiệm 50K', 
    'Giảm giá 50,000 VNĐ cho đơn hàng từ 500K', 'fixed', 50000.00,
    500000, NULL, '2024-01-01', '2024-12-31', 1
),
(
    'promo_003', 'default', 'VIP20', 'Khách hàng VIP', 
    'Giảm giá 20% cho khách hàng VIP', 'percentage', 20.00,
    200000, 100000, '2024-01-01', '2024-12-31', 0
);