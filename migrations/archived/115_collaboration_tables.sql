-- Collaboration Tables Migration
-- Based on RealtimeCollaborationService.ts requirements

-- Collaboration sessions table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    document_type TEXT NOT NULL,
    document_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    user_color TEXT NOT NULL DEFAULT '#000000',
    cursor_x INTEGER DEFAULT 0,
    cursor_y INTEGER DEFAULT 0,
    selection_start INTEGER DEFAULT 0,
    selection_end INTEGER DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_activity TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Document locks table
CREATE TABLE IF NOT EXISTS document_locks (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    document_type TEXT NOT NULL,
    document_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    lock_type TEXT NOT NULL DEFAULT 'edit',
    acquired_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
);

-- Collaboration operations table
CREATE TABLE IF NOT EXISTS collaboration_operations (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL DEFAULT 'default',
    session_id TEXT NOT NULL,
    document_type TEXT NOT NULL,
    document_id TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    operation_data_json TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    length INTEGER NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_document ON collaboration_sessions(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_user ON collaboration_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_tenant ON collaboration_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_active ON collaboration_sessions(is_active);

CREATE INDEX IF NOT EXISTS idx_document_locks_document ON document_locks(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_document_locks_user ON document_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_document_locks_tenant ON document_locks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_locks_expires ON document_locks(expires_at);

CREATE INDEX IF NOT EXISTS idx_collaboration_operations_session ON collaboration_operations(session_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_operations_document ON collaboration_operations(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_operations_tenant ON collaboration_operations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_operations_created ON collaboration_operations(created_at);