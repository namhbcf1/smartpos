CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('earn', 'redeem', 'expire', 'adjust')),
  reason TEXT NOT NULL,
  order_id TEXT,
  tenant_id TEXT NOT NULL DEFAULT 'default',
  created_at TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_tenant ON loyalty_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_created ON loyalty_transactions(created_at);
