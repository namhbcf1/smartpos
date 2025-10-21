-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    created_by TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('sales', 'inventory', 'financial', 'customer', 'product', 'custom')),
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    parameters TEXT DEFAULT '{}', -- JSON string
    schedule TEXT, -- JSON string with frequency, time, enabled
    chart_config TEXT, -- JSON string with type, x_axis, y_axis, colors
    last_run TEXT, -- ISO datetime
    next_run TEXT, -- ISO datetime
    shared_with TEXT DEFAULT '[]', -- JSON array of user IDs
    tags TEXT DEFAULT '[]', -- JSON array of tags
    is_archived INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT datetime('now'),
    updated_at TEXT NOT NULL DEFAULT datetime('now')
);

-- Create report_comments table
CREATE TABLE IF NOT EXISTS report_comments (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_internal INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT datetime('now'),
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- Create report_templates table
CREATE TABLE IF NOT EXISTS report_templates (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    created_by TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT DEFAULT '',
    template_data TEXT NOT NULL, -- JSON string with full report configuration
    is_public INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT datetime('now'),
    updated_at TEXT NOT NULL DEFAULT datetime('now')
);

-- Create report_runs table for tracking report executions
CREATE TABLE IF NOT EXISTS report_runs (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    parameters TEXT DEFAULT '{}', -- JSON string
    result_data TEXT, -- JSON string with report data
    execution_time INTEGER, -- milliseconds
    record_count INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TEXT NOT NULL DEFAULT datetime('now'),
    completed_at TEXT,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- Create report_subscriptions table for scheduled reports
CREATE TABLE IF NOT EXISTS report_subscriptions (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT NOT NULL,
    email TEXT,
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    time TEXT NOT NULL, -- HH:MM format
    is_active INTEGER DEFAULT 1,
    last_sent TEXT,
    next_send TEXT,
    created_at TEXT NOT NULL DEFAULT datetime('now'),
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- Create report_alerts table for report-based alerts
CREATE TABLE IF NOT EXISTS report_alerts (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    created_by TEXT NOT NULL,
    name TEXT NOT NULL,
    condition TEXT NOT NULL, -- SQL condition or expression
    threshold_value REAL NOT NULL,
    message TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    last_triggered TEXT,
    trigger_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT datetime('now'),
    updated_at TEXT NOT NULL DEFAULT datetime('now'),
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- Create report_shares table for sharing reports
CREATE TABLE IF NOT EXISTS report_shares (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    shared_by TEXT NOT NULL,
    shared_with TEXT NOT NULL, -- user_id or role_id
    share_type TEXT NOT NULL CHECK (share_type IN ('user', 'role', 'public')),
    permissions TEXT DEFAULT 'read', -- JSON string with permissions
    expires_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT datetime('now'),
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- Create report_widgets table for dashboard widgets
CREATE TABLE IF NOT EXISTS report_widgets (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    config TEXT NOT NULL, -- JSON string with widget configuration
    position TEXT NOT NULL, -- JSON string with x, y, w, h
    is_public INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT datetime('now'),
    updated_at TEXT NOT NULL DEFAULT datetime('now')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_tenant_id ON reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_last_run ON reports(last_run);

CREATE INDEX IF NOT EXISTS idx_report_comments_report_id ON report_comments(report_id);
CREATE INDEX IF NOT EXISTS idx_report_comments_tenant_id ON report_comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_comments_created_at ON report_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_report_templates_tenant_id ON report_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(type);
CREATE INDEX IF NOT EXISTS idx_report_templates_is_public ON report_templates(is_public);

CREATE INDEX IF NOT EXISTS idx_report_runs_report_id ON report_runs(report_id);
CREATE INDEX IF NOT EXISTS idx_report_runs_tenant_id ON report_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_runs_status ON report_runs(status);
CREATE INDEX IF NOT EXISTS idx_report_runs_started_at ON report_runs(started_at);

CREATE INDEX IF NOT EXISTS idx_report_subscriptions_report_id ON report_subscriptions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_subscriptions_tenant_id ON report_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_subscriptions_next_send ON report_subscriptions(next_send);

CREATE INDEX IF NOT EXISTS idx_report_alerts_report_id ON report_alerts(report_id);
CREATE INDEX IF NOT EXISTS idx_report_alerts_tenant_id ON report_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_alerts_is_active ON report_alerts(is_active);

CREATE INDEX IF NOT EXISTS idx_report_shares_report_id ON report_shares(report_id);
CREATE INDEX IF NOT EXISTS idx_report_shares_tenant_id ON report_shares(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_shares_shared_with ON report_shares(shared_with);

CREATE INDEX IF NOT EXISTS idx_report_widgets_tenant_id ON report_widgets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_widgets_user_id ON report_widgets(user_id);

-- Insert some sample report templates
INSERT INTO report_templates (id, tenant_id, created_by, name, type, description, template_data, is_public) VALUES
('template-sales-daily', 'default', 'admin', 'Báo cáo doanh thu hàng ngày', 'sales', 'Mẫu báo cáo doanh thu theo ngày', '{"name": "Báo cáo doanh thu hàng ngày", "type": "sales", "description": "Tổng hợp doanh thu và số lượng bán hàng theo ngày", "parameters": {"date_range": "last_30_days"}, "chart_config": {"type": "line", "x_axis": "date", "y_axis": "amount", "colors": ["#1976d2", "#dc004e"]}}', 1),
('template-inventory-category', 'default', 'admin', 'Báo cáo tồn kho theo danh mục', 'inventory', 'Mẫu báo cáo tồn kho theo danh mục sản phẩm', '{"name": "Báo cáo tồn kho theo danh mục", "type": "inventory", "description": "Phân tích tồn kho theo từng danh mục sản phẩm", "parameters": {"category": "all"}, "chart_config": {"type": "pie", "x_axis": "category", "y_axis": "quantity", "colors": ["#1976d2", "#dc004e", "#9c27b0", "#2e7d32"]}}', 1),
('template-customer-vip', 'default', 'admin', 'Báo cáo khách hàng VIP', 'customer', 'Mẫu báo cáo khách hàng có giá trị cao', '{"name": "Báo cáo khách hàng VIP", "type": "customer", "description": "Danh sách khách hàng có giá trị cao nhất", "parameters": {"min_amount": 1000000}, "chart_config": {"type": "table", "x_axis": "customer", "y_axis": "amount", "colors": ["#1976d2"]}}', 1),
('template-financial-monthly', 'default', 'admin', 'Báo cáo tài chính hàng tháng', 'financial', 'Mẫu báo cáo tài chính theo tháng', '{"name": "Báo cáo tài chính hàng tháng", "type": "financial", "description": "Tổng hợp doanh thu, chi phí và lợi nhuận theo tháng", "parameters": {"period": "monthly"}, "chart_config": {"type": "bar", "x_axis": "month", "y_axis": "amount", "colors": ["#2e7d32", "#ff9800"]}}', 1),
('template-product-sales', 'default', 'admin', 'Báo cáo bán hàng theo sản phẩm', 'product', 'Mẫu báo cáo bán hàng theo từng sản phẩm', '{"name": "Báo cáo bán hàng theo sản phẩm", "type": "product", "description": "Phân tích doanh số bán hàng theo từng sản phẩm", "parameters": {"group_by": "product"}, "chart_config": {"type": "bar", "x_axis": "product", "y_axis": "sales", "colors": ["#1976d2", "#dc004e", "#9c27b0", "#2e7d32", "#ff9800"]}}', 1);

-- Insert some sample reports
INSERT INTO reports (id, tenant_id, created_by, name, type, description, parameters, schedule, chart_config) VALUES
('report-1', 'default', 'admin', 'Báo cáo doanh thu hàng ngày', 'sales', 'Tổng hợp doanh thu và số lượng bán hàng theo ngày', '{"date_range": "last_30_days"}', '{"frequency": "daily", "time": "08:00", "enabled": true}', '{"type": "line", "x_axis": "date", "y_axis": "amount", "colors": ["#1976d2", "#dc004e"]}'),
('report-2', 'default', 'admin', 'Báo cáo tồn kho theo danh mục', 'inventory', 'Phân tích tồn kho theo từng danh mục sản phẩm', '{"category": "all"}', '{"frequency": "weekly", "time": "09:00", "enabled": true}', '{"type": "pie", "x_axis": "category", "y_axis": "quantity", "colors": ["#1976d2", "#dc004e", "#9c27b0", "#2e7d32"]}'),
('report-3', 'default', 'admin', 'Báo cáo khách hàng VIP', 'customer', 'Danh sách khách hàng có giá trị cao nhất', '{"min_amount": 1000000}', '{"frequency": "monthly", "time": "10:00", "enabled": true}', '{"type": "table", "x_axis": "customer", "y_axis": "amount", "colors": ["#1976d2"]}'),
('report-4', 'default', 'admin', 'Báo cáo tài chính hàng tháng', 'financial', 'Tổng hợp doanh thu, chi phí và lợi nhuận theo tháng', '{"period": "monthly"}', '{"frequency": "monthly", "time": "11:00", "enabled": false}', '{"type": "bar", "x_axis": "month", "y_axis": "amount", "colors": ["#2e7d32", "#ff9800"]}'),
('report-5', 'default', 'admin', 'Báo cáo bán hàng theo sản phẩm', 'product', 'Phân tích doanh số bán hàng theo từng sản phẩm', '{"group_by": "product"}', '{"frequency": "weekly", "time": "14:00", "enabled": true}', '{"type": "bar", "x_axis": "product", "y_axis": "sales", "colors": ["#1976d2", "#dc004e", "#9c27b0", "#2e7d32", "#ff9800"]}');