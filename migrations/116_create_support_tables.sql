-- Migration 116: Create Support Tables (idempotent)
-- Purpose: Create support ticket system tables
-- Date: 2025-01-27
-- Ensure a clean schema if an older incompatible table exists
DROP INDEX IF EXISTS idx_support_tickets_assigned;
DROP INDEX IF EXISTS idx_support_tickets_tenant;
DROP INDEX IF EXISTS idx_support_tickets_status;
DROP INDEX IF EXISTS idx_support_tickets_priority;
DROP INDEX IF EXISTS idx_support_tickets_created_by;
DROP INDEX IF EXISTS idx_support_tickets_customer_email;
DROP INDEX IF EXISTS idx_support_tickets_created_at;
DROP TABLE IF EXISTS support_tickets;

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT DEFAULT 'default',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  category TEXT,
  assigned_to TEXT,
  tags TEXT, -- JSON array as string
  due_date TEXT,
  resolution_notes TEXT,
  resolved_at TEXT,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- Support Replies Table
CREATE TABLE IF NOT EXISTS support_replies (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  ticket_id TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id TEXT NOT NULL,
  is_internal INTEGER DEFAULT 0, -- 0 = public, 1 = internal
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant ON support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority, tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to, tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by ON support_tickets(created_by, tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_email ON support_tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_replies_ticket ON support_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_replies_user ON support_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_support_replies_created_at ON support_replies(created_at DESC);

-- Triggers to update updated_at
CREATE TRIGGER IF NOT EXISTS update_support_tickets_timestamp
AFTER UPDATE ON support_tickets
BEGIN
  UPDATE support_tickets SET updated_at = datetime('now') WHERE id = NEW.id;
END;