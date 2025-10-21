-- Reporting Tables Migration
-- Based on ReportingService.ts requirements

-- Report definitions table
CREATE TABLE IF NOT EXISTS report_definitions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'custom',
    query TEXT NOT NULL,
    columns_json TEXT NOT NULL DEFAULT '[]',
    filters_json TEXT NOT NULL DEFAULT '{}',
    chart_type TEXT,
    refresh_interval INTEGER,
    is_scheduled INTEGER NOT NULL DEFAULT 0,
    schedule_config_json TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Report executions table
CREATE TABLE IF NOT EXISTS report_executions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    report_id TEXT NOT NULL,
    executed_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    parameters_json TEXT,
    result_json TEXT,
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Report schedules table
CREATE TABLE IF NOT EXISTS report_schedules (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    report_id TEXT NOT NULL,
    frequency TEXT NOT NULL,
    time TEXT NOT NULL,
    day_of_week INTEGER,
    day_of_month INTEGER,
    recipients_json TEXT NOT NULL DEFAULT '[]',
    format TEXT NOT NULL DEFAULT 'pdf',
    is_active INTEGER NOT NULL DEFAULT 1,
    last_run TEXT,
    next_run TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_definitions_tenant ON report_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_definitions_category ON report_definitions(category);
CREATE INDEX IF NOT EXISTS idx_report_definitions_active ON report_definitions(is_active);

CREATE INDEX IF NOT EXISTS idx_report_executions_report ON report_executions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_tenant ON report_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);
CREATE INDEX IF NOT EXISTS idx_report_executions_created ON report_executions(created_at);

CREATE INDEX IF NOT EXISTS idx_report_schedules_report ON report_schedules(report_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_tenant ON report_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_active ON report_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run);