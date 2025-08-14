-- ============================================================================
-- MIGRATION 0002: Enhanced Modules for ComputerPOS Pro
-- Created: 2024-01-01
-- Description: Add tables for warranty management, employee management, 
--              debt management, payments, pre-orders, promotions, and analytics
-- ============================================================================

-- ============================================================================
-- WARRANTY & SERIAL NUMBER MANAGEMENT TABLES
-- ============================================================================

-- Serial Numbers tracking table
CREATE TABLE IF NOT EXISTS serial_numbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_number TEXT NOT NULL UNIQUE,
    product_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold', 'returned', 'defective', 'warranty_claim')),
    purchase_date DATETIME,
    sale_date DATETIME,
    customer_id INTEGER,
    sale_id INTEGER,
    warranty_start_date DATETIME,
    warranty_end_date DATETIME,
    warranty_period_months INTEGER DEFAULT 12,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Warranty claims tracking
CREATE TABLE IF NOT EXISTS warranty_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_number TEXT NOT NULL UNIQUE,
    serial_number_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    claim_type TEXT NOT NULL CHECK (claim_type IN ('repair', 'replacement', 'refund')),
    issue_description TEXT NOT NULL,
    claim_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_progress', 'completed', 'rejected', 'cancelled')),
    resolution_description TEXT,
    resolution_date DATETIME,
    cost DECIMAL(15,2) DEFAULT 0,
    technician_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Warranty notifications
CREATE TABLE IF NOT EXISTS warranty_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_number_id INTEGER NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('expiring_soon', 'expired', 'claim_update')),
    message TEXT NOT NULL,
    sent_date DATETIME,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    recipient_email TEXT,
    recipient_phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (serial_number_id) REFERENCES serial_numbers(id) ON DELETE CASCADE
);

-- ============================================================================
-- EMPLOYEE MANAGEMENT & PERMISSIONS TABLES
-- ============================================================================

-- Enhanced users table with employee details
CREATE TABLE IF NOT EXISTS employee_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    employee_code TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    hire_date DATE NOT NULL,
    position TEXT NOT NULL,
    department TEXT,
    salary DECIMAL(15,2),
    commission_rate DECIMAL(5,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    bank_account TEXT,
    tax_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Role-based permissions
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions TEXT NOT NULL, -- JSON array of permissions
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User role assignments
CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_by INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(user_id, role_id)
);

-- Employee performance tracking
CREATE TABLE IF NOT EXISTS employee_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    sales_count INTEGER DEFAULT 0,
    sales_amount DECIMAL(15,2) DEFAULT 0,
    commission_earned DECIMAL(15,2) DEFAULT 0,
    customer_satisfaction_score DECIMAL(3,2),
    performance_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id) ON DELETE CASCADE
);

-- Attendance tracking
CREATE TABLE IF NOT EXISTS employee_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date DATE NOT NULL,
    check_in_time DATETIME,
    check_out_time DATETIME,
    break_duration_minutes INTEGER DEFAULT 0,
    total_hours DECIMAL(4,2),
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'overtime')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employee_profiles(id) ON DELETE CASCADE,
    UNIQUE(employee_id, date)
);

-- ============================================================================
-- DEBT MANAGEMENT SYSTEM TABLES
-- ============================================================================

-- Customer credit limits
CREATE TABLE IF NOT EXISTS customer_credit_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL UNIQUE,
    credit_limit DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    available_credit DECIMAL(15,2) GENERATED ALWAYS AS (credit_limit - current_balance) STORED,
    last_review_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Enhanced accounts receivable with aging
CREATE TABLE IF NOT EXISTS debt_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('debt', 'payment', 'adjustment')),
    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,
    due_date DATE,
    reference_id INTEGER,
    reference_type TEXT CHECK (reference_type IN ('sale', 'payment', 'adjustment')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'written_off')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Payment reminders and notifications
CREATE TABLE IF NOT EXISTS payment_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    debt_transaction_id INTEGER NOT NULL,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms', 'call', 'letter')),
    scheduled_date DATE NOT NULL,
    sent_date DATETIME,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (debt_transaction_id) REFERENCES debt_transactions(id) ON DELETE CASCADE
);

-- ============================================================================
-- VIETNAMESE PAYMENT INTEGRATION TABLES
-- ============================================================================

-- Payment gateways configuration
CREATE TABLE IF NOT EXISTS payment_gateways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL CHECK (provider IN ('vnpay', 'momo', 'zalopay', 'shopee_pay', 'vietqr')),
    is_active BOOLEAN DEFAULT TRUE,
    configuration TEXT NOT NULL, -- JSON configuration
    test_mode BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id TEXT NOT NULL UNIQUE,
    gateway_id INTEGER NOT NULL,
    sale_id INTEGER,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'VND',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    gateway_transaction_id TEXT,
    gateway_response TEXT, -- JSON response from gateway
    callback_data TEXT, -- JSON callback data
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gateway_id) REFERENCES payment_gateways(id) ON DELETE CASCADE,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL
);

-- QR Code payments
CREATE TABLE IF NOT EXISTS qr_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    qr_code TEXT NOT NULL UNIQUE,
    sale_id INTEGER,
    amount DECIMAL(15,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'VND',
    expires_at DATETIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
    paid_at DATETIME,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Serial numbers indexes
CREATE INDEX IF NOT EXISTS idx_serial_numbers_product ON serial_numbers(product_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON serial_numbers(status);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_customer ON serial_numbers(customer_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_warranty ON serial_numbers(warranty_end_date);

-- Warranty claims indexes
CREATE INDEX IF NOT EXISTS idx_warranty_claims_serial ON warranty_claims(serial_number_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_customer ON warranty_claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON warranty_claims(status);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_date ON warranty_claims(claim_date);

-- Employee indexes
CREATE INDEX IF NOT EXISTS idx_employee_profiles_user ON employee_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_code ON employee_profiles(employee_code);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_status ON employee_profiles(status);

-- Debt management indexes
CREATE INDEX IF NOT EXISTS idx_debt_transactions_customer ON debt_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_debt_transactions_status ON debt_transactions(status);
CREATE INDEX IF NOT EXISTS idx_debt_transactions_due_date ON debt_transactions(due_date);

-- Payment indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway ON payment_transactions(gateway_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_sale ON payment_transactions(sale_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
