-- Migration: 129_create_warranties_table.sql
-- Create warranties table for warranty management

CREATE TABLE IF NOT EXISTS warranties (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    warranty_code TEXT NOT NULL,
    product_id TEXT NOT NULL,
    customer_id TEXT,
    sale_id TEXT,
    warranty_type TEXT NOT NULL DEFAULT 'standard',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    UNIQUE (tenant_id, warranty_code)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_warranties_tenant_id ON warranties (tenant_id);
CREATE INDEX IF NOT EXISTS idx_warranties_warranty_code ON warranties (warranty_code);
CREATE INDEX IF NOT EXISTS idx_warranties_product_id ON warranties (product_id);
CREATE INDEX IF NOT EXISTS idx_warranties_customer_id ON warranties (customer_id);
CREATE INDEX IF NOT EXISTS idx_warranties_sale_id ON warranties (sale_id);
CREATE INDEX IF NOT EXISTS idx_warranties_warranty_type ON warranties (warranty_type);
CREATE INDEX IF NOT EXISTS idx_warranties_status ON warranties (status);
CREATE INDEX IF NOT EXISTS idx_warranties_start_date ON warranties (start_date);
CREATE INDEX IF NOT EXISTS idx_warranties_end_date ON warranties (end_date);
CREATE INDEX IF NOT EXISTS idx_warranties_created_at ON warranties (created_at);

-- Insert sample data
INSERT OR IGNORE INTO warranties (
    id, tenant_id, warranty_code, product_id, customer_id, sale_id,
    warranty_type, start_date, end_date, status, notes
) VALUES 
(
    'warranty_001', 'default', 'WR001', 'prod_001', 'cust_001', 'sale_001',
    'standard', '2024-01-01', '2025-01-01', 'active', 'Bảo hành tiêu chuẩn 12 tháng'
),
(
    'warranty_002', 'default', 'WR002', 'prod_002', 'cust_002', 'sale_002',
    'extended', '2024-01-01', '2026-01-01', 'active', 'Bảo hành mở rộng 24 tháng'
),
(
    'warranty_003', 'default', 'WR003', 'prod_003', 'cust_003', 'sale_003',
    'premium', '2024-01-01', '2027-01-01', 'active', 'Bảo hành cao cấp 36 tháng'
);