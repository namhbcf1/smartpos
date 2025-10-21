-- Loyalty Program Tables Migration
-- Based on LoyaltyProgramService.ts requirements

-- Loyalty programs table
CREATE TABLE IF NOT EXISTS loyalty_programs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    points_per_dollar REAL NOT NULL DEFAULT 1.0,
    tier_requirements TEXT NOT NULL DEFAULT '{}',
    benefits TEXT,
    created_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Customer loyalty status table
CREATE TABLE IF NOT EXISTS customer_loyalty_status (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    customer_id TEXT NOT NULL,
    program_id TEXT NOT NULL,
    current_tier TEXT NOT NULL DEFAULT 'bronze',
    total_points INTEGER NOT NULL DEFAULT 0,
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_activity TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Loyalty transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    customer_id TEXT NOT NULL,
    program_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'expire', 'adjust')),
    points INTEGER NOT NULL,
    description TEXT NOT NULL,
    order_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_tenant ON loyalty_programs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_active ON loyalty_programs(is_active);

CREATE INDEX IF NOT EXISTS idx_customer_loyalty_status_customer ON customer_loyalty_status(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_status_program ON customer_loyalty_status(program_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_status_tenant ON customer_loyalty_status(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_loyalty_status_tier ON customer_loyalty_status(current_tier);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_program ON loyalty_transactions(program_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_tenant ON loyalty_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created ON loyalty_transactions(created_at);

-- Sample data for testing
INSERT OR IGNORE INTO loyalty_programs (
    id, tenant_id, name, description, is_active, points_per_dollar, tier_requirements, benefits, created_at, updated_at
) VALUES
('loyalty-001', 'default', 'Standard Loyalty Program', 'Earn points on every purchase', 1, 1.0, 
 '{"bronze":{"min_points":0,"discount":0},"silver":{"min_points":1000,"discount":5},"gold":{"min_points":5000,"discount":10}}',
 '{"bronze":"Basic rewards","silver":"5% discount","gold":"10% discount + free shipping"}',
 datetime('now'), datetime('now'));