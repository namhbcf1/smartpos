-- Migration: 127_create_suppliers_table.sql
-- Create suppliers table for supplier management

CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_number TEXT,
    payment_terms TEXT,
    credit_limit_cents INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant_id ON suppliers (tenant_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers (name);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers (email);
CREATE INDEX IF NOT EXISTS idx_suppliers_phone ON suppliers (phone);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON suppliers (is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON suppliers (created_at);

-- Insert sample data
INSERT OR IGNORE INTO suppliers (
    id, tenant_id, name, contact_person, email, phone, address, 
    tax_number, payment_terms, credit_limit_cents, is_active
) VALUES 
(
    'supplier_001', 'default', 'Công ty TNHH ABC', 'Nguyễn Văn A', 
    'contact@abc.com', '0901234567', '123 Đường ABC, Quận 1, TP.HCM',
    '0123456789', 'Thanh toán trong 30 ngày', 100000000, 1
),
(
    'supplier_002', 'default', 'Công ty XYZ', 'Trần Thị B', 
    'info@xyz.com', '0907654321', '456 Đường XYZ, Quận 2, TP.HCM',
    '0987654321', 'Thanh toán trước khi giao hàng', 50000000, 1
),
(
    'supplier_003', 'default', 'Nhà cung cấp DEF', 'Lê Văn C', 
    'sales@def.com', '0909876543', '789 Đường DEF, Quận 3, TP.HCM',
    '0456789012', 'Thanh toán COD', 20000000, 0
);