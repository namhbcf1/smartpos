-- VNPay Token Tables
-- Migration for VNPay Token functionality

-- Table for storing VNPay tokens
CREATE TABLE IF NOT EXISTS vnp_tokens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT DEFAULT 'default',
  user_id TEXT NOT NULL,
  vnp_token TEXT NOT NULL,
  card_mask TEXT,
  card_type TEXT, -- '01' for domestic, '02' for international
  bank_code TEXT,
  created_at TEXT DEFAULT datetime('now'),
  updated_at TEXT DEFAULT datetime('now'),
  last_4 TEXT,
  brand TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'disabled'
  source_txn_ref TEXT, -- merchant's txn_ref that created token
  UNIQUE(vnp_token, tenant_id)
);

-- Table for VNPay transactions
CREATE TABLE IF NOT EXISTS vnp_transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT DEFAULT 'default',
  txn_ref TEXT NOT NULL, -- merchant's transaction reference
  vnp_transaction_no TEXT,
  vnp_amount INTEGER, -- amount in cents
  currency TEXT DEFAULT 'VND',
  status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed', 'cancelled'
  response_code TEXT,
  transaction_status TEXT,
  vnp_secure_hash_received TEXT,
  pay_date TEXT,
  ipn_received_at TEXT,
  return_received_at TEXT,
  metadata TEXT, -- JSON metadata
  created_at TEXT DEFAULT datetime('now'),
  updated_at TEXT DEFAULT datetime('now'),
  UNIQUE(txn_ref, tenant_id)
);

-- Table for VNPay token transactions (payments using tokens)
CREATE TABLE IF NOT EXISTS vnp_token_transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT DEFAULT 'default',
  token_id TEXT NOT NULL,
  txn_ref TEXT NOT NULL,
  vnp_transaction_no TEXT,
  vnp_amount INTEGER,
  currency TEXT DEFAULT 'VND',
  status TEXT DEFAULT 'pending',
  response_code TEXT,
  transaction_status TEXT,
  vnp_secure_hash_received TEXT,
  pay_date TEXT,
  ipn_received_at TEXT,
  return_received_at TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT datetime('now'),
  updated_at TEXT DEFAULT datetime('now'),
  FOREIGN KEY (token_id) REFERENCES vnp_tokens(id),
  UNIQUE(txn_ref, tenant_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vnp_tokens_user_id ON vnp_tokens(user_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_vnp_tokens_status ON vnp_tokens(status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_vnp_transactions_txn_ref ON vnp_transactions(txn_ref, tenant_id);
CREATE INDEX IF NOT EXISTS idx_vnp_transactions_status ON vnp_transactions(status, tenant_id);
CREATE INDEX IF NOT EXISTS idx_vnp_token_transactions_token_id ON vnp_token_transactions(token_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_vnp_token_transactions_txn_ref ON vnp_token_transactions(txn_ref, tenant_id);

-- Triggers for updated_at
CREATE TRIGGER IF NOT EXISTS update_vnp_tokens_updated_at 
  AFTER UPDATE ON vnp_tokens
  BEGIN
    UPDATE vnp_tokens SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_vnp_transactions_updated_at 
  AFTER UPDATE ON vnp_transactions
  BEGIN
    UPDATE vnp_transactions SET updated_at = datetime('now') WHERE id = NEW.id;
  END;

CREATE TRIGGER IF NOT EXISTS update_vnp_token_transactions_updated_at 
  AFTER UPDATE ON vnp_token_transactions
  BEGIN
    UPDATE vnp_token_transactions SET updated_at = datetime('now') WHERE id = NEW.id;
  END;
