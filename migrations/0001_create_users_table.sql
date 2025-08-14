-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL,
    store_id INTEGER,
    active INTEGER NOT NULL DEFAULT 1,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

-- Insert admin user
INSERT OR REPLACE INTO users (
    id, username, password_hash, full_name, email, phone, role, store_id, active
) VALUES (
    2, 'admin', 'admin123456', 'Administrator', 'admin@smartpos.com', NULL, 'admin', 1, 1
);
