-- Migration: 130_create_warehouses_table.sql
-- Create warehouses table

CREATE TABLE IF NOT EXISTS warehouses (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT DEFAULT 'default' NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    manager_id TEXT,
    is_active INTEGER DEFAULT 1, -- 0 for inactive, 1 for active
    created_by TEXT,
    updated_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_warehouses_tenant_id ON warehouses (tenant_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses (code);
CREATE INDEX IF NOT EXISTS idx_warehouses_name ON warehouses (name);
CREATE INDEX IF NOT EXISTS idx_warehouses_is_active ON warehouses (is_active);
CREATE INDEX IF NOT EXISTS idx_warehouses_manager_id ON warehouses (manager_id);

-- Create unique constraint for code per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_warehouses_code_tenant ON warehouses (code, tenant_id);