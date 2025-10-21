-- Create dashboard_widgets table
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('chart', 'metric', 'table', 'list', 'alert', 'gauge', 'progress')),
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    data TEXT DEFAULT '{}', -- JSON string
    position TEXT NOT NULL DEFAULT '{"x":0,"y":0,"w":4,"h":3}', -- JSON string with x, y, w, h
    config TEXT DEFAULT '{}', -- JSON string with chart config
    refresh_interval INTEGER DEFAULT 30000, -- milliseconds
    is_public INTEGER DEFAULT 0,
    last_updated TEXT,
    created_at TEXT NOT NULL DEFAULT datetime('now'),
    updated_at TEXT NOT NULL DEFAULT datetime('now')
);

-- Create dashboard_configs table
CREATE TABLE IF NOT EXISTS dashboard_configs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT NOT NULL,
    layout TEXT NOT NULL DEFAULT 'grid' CHECK (layout IN ('grid', 'list', 'custom')),
    theme TEXT NOT NULL DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
    refresh_interval INTEGER DEFAULT 30000, -- milliseconds
    widgets TEXT DEFAULT '[]', -- JSON array of widget IDs
    permissions TEXT DEFAULT '{}', -- JSON object with permissions
    created_at TEXT NOT NULL DEFAULT datetime('now'),
    updated_at TEXT NOT NULL DEFAULT datetime('now')
);

-- Create dashboard_comments table
CREATE TABLE IF NOT EXISTS dashboard_comments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT NOT NULL,
    widget_id TEXT, -- Optional: comment on specific widget
    content TEXT NOT NULL,
    is_internal INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT datetime('now')
);

-- Create dashboard_feedback table
CREATE TABLE IF NOT EXISTS dashboard_feedback (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT datetime('now')
);

-- Create dashboard_activities table for tracking user activities
CREATE TABLE IF NOT EXISTS dashboard_activities (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('order', 'payment', 'inventory', 'customer', 'system', 'user')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'info' CHECK (status IN ('success', 'warning', 'error', 'info')),
    metadata TEXT DEFAULT '{}', -- JSON string with additional data
    created_at TEXT NOT NULL DEFAULT datetime('now')
);

-- Create dashboard_alerts table
CREATE TABLE IF NOT EXISTS dashboard_alerts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('error', 'warning', 'info', 'success')),
    type TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('system', 'business', 'security')),
    is_read INTEGER DEFAULT 0,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT datetime('now')
);

-- Create dashboard_shortcuts table
CREATE TABLE IF NOT EXISTS dashboard_shortcuts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT datetime('now')
);

-- Create dashboard_templates table
CREATE TABLE IF NOT EXISTS dashboard_templates (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    created_by TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    template_data TEXT NOT NULL, -- JSON string with full dashboard configuration
    is_public INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT datetime('now'),
    updated_at TEXT NOT NULL DEFAULT datetime('now')
);

-- Create dashboard_shares table
CREATE TABLE IF NOT EXISTS dashboard_shares (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    shared_by TEXT NOT NULL,
    shared_with TEXT NOT NULL, -- user_id or role_id
    share_type TEXT NOT NULL CHECK (share_type IN ('user', 'role', 'public')),
    permissions TEXT DEFAULT 'read', -- JSON string with permissions
    expires_at TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT datetime('now')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_tenant_user ON dashboard_widgets(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_type ON dashboard_widgets(type);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_public ON dashboard_widgets(is_public);

CREATE INDEX IF NOT EXISTS idx_dashboard_configs_tenant_user ON dashboard_configs(tenant_id, user_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_comments_tenant ON dashboard_comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_comments_widget ON dashboard_comments(widget_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_comments_created ON dashboard_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_dashboard_feedback_tenant ON dashboard_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_feedback_rating ON dashboard_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_dashboard_feedback_category ON dashboard_feedback(category);

CREATE INDEX IF NOT EXISTS idx_dashboard_activities_tenant ON dashboard_activities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_activities_user ON dashboard_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_activities_type ON dashboard_activities(type);
CREATE INDEX IF NOT EXISTS idx_dashboard_activities_status ON dashboard_activities(status);
CREATE INDEX IF NOT EXISTS idx_dashboard_activities_created ON dashboard_activities(created_at);

CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_tenant ON dashboard_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_user ON dashboard_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_severity ON dashboard_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_type ON dashboard_alerts(type);
CREATE INDEX IF NOT EXISTS idx_dashboard_alerts_read ON dashboard_alerts(is_read);

CREATE INDEX IF NOT EXISTS idx_dashboard_shortcuts_tenant_user ON dashboard_shortcuts(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_shortcuts_order ON dashboard_shortcuts(order_index);

CREATE INDEX IF NOT EXISTS idx_dashboard_templates_tenant ON dashboard_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_templates_public ON dashboard_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_dashboard_templates_usage ON dashboard_templates(usage_count);

CREATE INDEX IF NOT EXISTS idx_dashboard_shares_tenant ON dashboard_shares(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_with ON dashboard_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_dashboard_shares_active ON dashboard_shares(is_active);

-- Insert some sample dashboard templates
INSERT INTO dashboard_templates (id, tenant_id, created_by, name, description, template_data, is_public) VALUES
('template-sales-dashboard', 'default', 'admin', 'Dashboard Bán hàng', 'Dashboard tổng quan cho bộ phận bán hàng', '{"layout":"grid","theme":"light","widgets":[{"id":"revenue-chart","type":"chart","title":"Biểu đồ doanh thu","position":{"x":0,"y":0,"w":6,"h":4},"config":{"chartType":"line"}},{"id":"orders-table","type":"table","title":"Bảng đơn hàng","position":{"x":6,"y":0,"w":6,"h":4},"config":{}},{"id":"revenue-metric","type":"metric","title":"Doanh thu hôm nay","position":{"x":0,"y":4,"w":3,"h":2},"config":{}},{"id":"orders-metric","type":"metric","title":"Số đơn hàng","position":{"x":3,"y":4,"w":3,"h":2},"config":{}},{"id":"customers-metric","type":"metric","title":"Khách hàng mới","position":{"x":6,"y":4,"w":3,"h":2},"config":{}},{"id":"activities-list","type":"list","title":"Hoạt động gần đây","position":{"x":9,"y":4,"w":3,"h":2},"config":{}}]}', 1),
('template-inventory-dashboard', 'default', 'admin', 'Dashboard Kho hàng', 'Dashboard quản lý kho hàng và tồn kho', '{"layout":"grid","theme":"light","widgets":[{"id":"stock-chart","type":"chart","title":"Biểu đồ tồn kho","position":{"x":0,"y":0,"w":8,"h":4},"config":{"chartType":"bar"}},{"id":"low-stock-alert","type":"alert","title":"Cảnh báo hết hàng","position":{"x":8,"y":0,"w":4,"h":4},"config":{}},{"id":"total-products","type":"metric","title":"Tổng sản phẩm","position":{"x":0,"y":4,"w":4,"h":2},"config":{}},{"id":"low-stock-count","type":"metric","title":"Sắp hết hàng","position":{"x":4,"y":4,"w":4,"h":2},"config":{}},{"id":"out-of-stock","type":"metric","title":"Hết hàng","position":{"x":8,"y":4,"w":4,"h":2},"config":{}}]}', 1),
('template-financial-dashboard', 'default', 'admin', 'Dashboard Tài chính', 'Dashboard phân tích tài chính và báo cáo', '{"layout":"grid","theme":"light","widgets":[{"id":"revenue-trend","type":"chart","title":"Xu hướng doanh thu","position":{"x":0,"y":0,"w":6,"h":4},"config":{"chartType":"line"}},{"id":"profit-chart","type":"chart","title":"Biểu đồ lợi nhuận","position":{"x":6,"y":0,"w":6,"h":4},"config":{"chartType":"area"}},{"id":"revenue-metric","type":"metric","title":"Doanh thu tháng","position":{"x":0,"y":4,"w":3,"h":2},"config":{}},{"id":"profit-metric","type":"metric","title":"Lợi nhuận","position":{"x":3,"y":4,"w":3,"h":2},"config":{}},{"id":"expenses-metric","type":"metric","title":"Chi phí","position":{"x":6,"y":4,"w":3,"h":2},"config":{}},{"id":"margin-metric","type":"metric","title":"Tỷ lệ lãi","position":{"x":9,"y":4,"w":3,"h":2},"config":{}}]}', 1);

-- Insert some sample dashboard widgets
INSERT INTO dashboard_widgets (id, tenant_id, user_id, type, title, description, data, position, config) VALUES
('widget-1', 'default', 'admin', 'chart', 'Biểu đồ doanh thu', 'Biểu đồ doanh thu theo ngày', '{"labels":["T2","T3","T4","T5","T6","T7","CN"],"datasets":[{"label":"Doanh thu","data":[12000,19000,3000,5000,2000,3000,15000]}]}', '{"x":0,"y":0,"w":6,"h":4}', '{"chartType":"line","colors":["#1976d2"],"showLegend":true}'),
('widget-2', 'default', 'admin', 'metric', 'Doanh thu hôm nay', 'Tổng doanh thu trong ngày', '{"value":12450000,"change":15.2,"trend":[10000000,11000000,9500000,12000000,11500000,13000000,12450000]}', '{"x":6,"y":0,"w":3,"h":2}', '{"format":"currency","unit":"VND"}'),
('widget-3', 'default', 'admin', 'metric', 'Đơn hàng mới', 'Số đơn hàng mới hôm nay', '{"value":24,"change":8.5,"trend":[15,18,12,20,22,25,24]}', '{"x":9,"y":0,"w":3,"h":2}', '{"format":"number","unit":"đơn"}'),
('widget-4', 'default', 'admin', 'table', 'Đơn hàng gần đây', 'Danh sách đơn hàng mới nhất', '{"columns":["Mã đơn","Khách hàng","Tổng tiền","Trạng thái"],"rows":[["ORD-001","Nguyễn Văn A","2,500,000","Hoàn thành"],["ORD-002","Trần Thị B","1,800,000","Đang xử lý"],["ORD-003","Lê Văn C","3,200,000","Hoàn thành"]]}', '{"x":0,"y":4,"w":6,"h":3}', '{"showHeader":true,"striped":true}'),
('widget-5', 'default', 'admin', 'list', 'Hoạt động gần đây', 'Các hoạt động mới nhất trong hệ thống', '{"items":[{"id":"1","title":"Đơn hàng mới","description":"Khách hàng A đặt hàng","timestamp":"2024-01-20T10:30:00Z"},{"id":"2","title":"Thanh toán","description":"Đơn hàng B đã thanh toán","timestamp":"2024-01-20T09:15:00Z"}]}', '{"x":6,"y":4,"w":6,"h":3}', '{"showTimestamp":true,"maxItems":5}');

-- Insert some sample dashboard shortcuts
INSERT INTO dashboard_shortcuts (id, tenant_id, user_id, title, url, icon, description, order_index) VALUES
('shortcut-1', 'default', 'admin', 'Tạo đơn hàng', '/pos', 'ShoppingCart', 'Bán hàng mới', 1),
('shortcut-2', 'default', 'admin', 'Quản lý sản phẩm', '/products', 'Inventory', 'Thêm/sửa sản phẩm', 2),
('shortcut-3', 'default', 'admin', 'Khách hàng', '/customers', 'People', 'Quản lý khách hàng', 3),
('shortcut-4', 'default', 'admin', 'Báo cáo', '/reports', 'Assessment', 'Xem báo cáo', 4),
('shortcut-5', 'default', 'admin', 'Cài đặt', '/settings', 'Settings', 'Cấu hình hệ thống', 5),
('shortcut-6', 'default', 'admin', 'Hỗ trợ', '/support', 'Support', 'Ticket hỗ trợ', 6);