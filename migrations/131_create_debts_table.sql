-- Migration: 131_create_debts_table.sql
-- Create debts table

CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY NOT NULL,
    tenant_id TEXT DEFAULT 'default' NOT NULL,
    customer_id TEXT,
    supplier_id TEXT,
    debt_type TEXT NOT NULL CHECK (debt_type IN ('customer', 'supplier')),
    amount REAL NOT NULL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    remaining REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
    due_date TEXT,
    notes TEXT,
    created_by TEXT,
    updated_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Create debt payments table for payment history
CREATE TABLE IF NOT EXISTS debt_payments (
    id TEXT PRIMARY KEY NOT NULL,
    debt_id TEXT NOT NULL,
    amount REAL NOT NULL,
    notes TEXT,
    created_by TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_debts_tenant_id ON debts (tenant_id);
CREATE INDEX IF NOT EXISTS idx_debts_customer_id ON debts (customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_supplier_id ON debts (supplier_id);
CREATE INDEX IF NOT EXISTS idx_debts_debt_type ON debts (debt_type);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts (status);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts (due_date);
CREATE INDEX IF NOT EXISTS idx_debts_created_at ON debts (created_at);

CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments (debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_created_at ON debt_payments (created_at);