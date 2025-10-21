-- Add Cash Drawer Tables
-- Migration to add cash drawer management tables

-- Cash drawers table
CREATE TABLE IF NOT EXISTS cash_drawers (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    location TEXT,
    current_balance REAL NOT NULL DEFAULT 0,
    is_open INTEGER NOT NULL DEFAULT 0,
    last_opened_at TEXT,
    last_closed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Cash drawer sessions table
CREATE TABLE IF NOT EXISTS cash_drawer_sessions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    drawer_id TEXT NOT NULL,
    opened_by TEXT NOT NULL,
    closed_by TEXT,
    opened_at TEXT NOT NULL DEFAULT (datetime('now')),
    closed_at TEXT,
    starting_balance REAL NOT NULL DEFAULT 0,
    ending_balance REAL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (drawer_id) REFERENCES cash_drawers(id) ON DELETE CASCADE
);

-- Cash drawer transactions table
CREATE TABLE IF NOT EXISTS cash_drawer_transactions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    drawer_id TEXT NOT NULL,
    session_id TEXT,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'cash_in', 'cash_out', 'open', 'close')),
    amount REAL NOT NULL,
    description TEXT,
    order_id TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (drawer_id) REFERENCES cash_drawers(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES cash_drawer_sessions(id) ON DELETE SET NULL
);

-- Audit logs table (if not exists)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    data_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cash_drawers_tenant ON cash_drawers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_drawers_is_open ON cash_drawers(is_open);

CREATE INDEX IF NOT EXISTS idx_cash_drawer_sessions_drawer ON cash_drawer_sessions(drawer_id);
CREATE INDEX IF NOT EXISTS idx_cash_drawer_sessions_status ON cash_drawer_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cash_drawer_sessions_tenant ON cash_drawer_sessions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_cash_drawer_transactions_drawer ON cash_drawer_transactions(drawer_id);
CREATE INDEX IF NOT EXISTS idx_cash_drawer_transactions_session ON cash_drawer_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_cash_drawer_transactions_type ON cash_drawer_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_cash_drawer_transactions_tenant ON cash_drawer_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_drawer_transactions_created ON cash_drawer_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- Sample data for testing
INSERT OR IGNORE INTO cash_drawers (
    id, tenant_id, name, location, current_balance, is_open, created_at, updated_at
) VALUES
('drawer-001', 'default', 'Main Cash Drawer', 'Front Desk', 500000, 0, datetime('now'), datetime('now')),
('drawer-002', 'default', 'Back Office Drawer', 'Back Office', 0, 0, datetime('now'), datetime('now'));