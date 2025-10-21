-- Promotion Tables Migration
-- Based on PromotionService.ts requirements

-- Promotion campaigns table
CREATE TABLE IF NOT EXISTS promotion_campaigns (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    store_id TEXT,
    campaign_name TEXT NOT NULL,
    description TEXT,
    campaign_type TEXT NOT NULL,
    discount_type TEXT,
    discount_value REAL DEFAULT 0,
    max_discount_amount REAL,
    buy_quantity INTEGER,
    get_quantity INTEGER,
    get_product_id TEXT,
    min_purchase_amount REAL DEFAULT 0,
    max_purchase_amount REAL,
    applicable_to TEXT DEFAULT 'all_products',
    applicable_items_json TEXT DEFAULT '[]',
    customer_tiers_json TEXT DEFAULT '[]',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    time_slots_json TEXT DEFAULT '[]',
    days_of_week_json TEXT DEFAULT '[]',
    total_usage_limit INTEGER,
    usage_per_customer INTEGER,
    current_usage_count INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    is_auto_apply INTEGER DEFAULT 0,
    is_combinable INTEGER DEFAULT 0,
    display_badge TEXT,
    display_badge_color TEXT,
    banner_image_url TEXT,
    tags_json TEXT DEFAULT '[]',
    terms_conditions TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    deleted_at TEXT
);

-- Promotion usage table
CREATE TABLE IF NOT EXISTS promotion_usage (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    customer_id TEXT,
    order_id TEXT,
    discount_amount REAL NOT NULL DEFAULT 0,
    used_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_tenant ON promotion_campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_store ON promotion_campaigns(store_id);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_type ON promotion_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_active ON promotion_campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_promotion_campaigns_dates ON promotion_campaigns(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_promotion_usage_campaign ON promotion_usage(campaign_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_customer ON promotion_usage(customer_id);
CREATE INDEX IF NOT EXISTS idx_promotion_usage_tenant ON promotion_usage(tenant_id);