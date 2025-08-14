-- ENHANCED ROLE-BASED ACCESS CONTROL (RBAC) SCHEMA
-- Comprehensive permission management system for SmartPOS

-- =====================================================
-- CORE PERMISSION TABLES
-- =====================================================

-- System resources (menu items, database tables, features)
CREATE TABLE IF NOT EXISTS system_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE, -- e.g., 'dashboard', 'products', 'sales.create'
  display_name TEXT NOT NULL, -- e.g., 'Dashboard', 'Sản phẩm', 'Tạo đơn hàng'
  resource_type TEXT NOT NULL CHECK (resource_type IN ('menu', 'database', 'feature')),
  parent_resource TEXT, -- For hierarchical permissions
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- System actions (what can be done with resources)
CREATE TABLE IF NOT EXISTS system_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE, -- e.g., 'view', 'create', 'update', 'delete', 'export'
  display_name TEXT NOT NULL, -- e.g., 'Xem', 'Tạo mới', 'Cập nhật', 'Xóa', 'Xuất dữ liệu'
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Permissions (resource + action combinations)
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  resource_id INTEGER NOT NULL,
  action_id INTEGER NOT NULL,
  permission_key TEXT NOT NULL UNIQUE, -- e.g., 'products.view', 'sales.create'
  display_name TEXT NOT NULL, -- e.g., 'Xem sản phẩm', 'Tạo đơn hàng'
  description TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (resource_id) REFERENCES system_resources(id) ON DELETE CASCADE,
  FOREIGN KEY (action_id) REFERENCES system_actions(id) ON DELETE CASCADE,
  UNIQUE(resource_id, action_id)
);

-- =====================================================
-- ROLE MANAGEMENT
-- =====================================================

-- Enhanced roles table
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_template INTEGER NOT NULL DEFAULT 0, -- 1 for role templates
  is_system INTEGER NOT NULL DEFAULT 0, -- 1 for system-defined roles
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Role permissions (which permissions each role has)
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  granted INTEGER NOT NULL DEFAULT 1, -- 1 = granted, 0 = denied
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  UNIQUE(role_id, permission_id)
);

-- =====================================================
-- EMPLOYEE PERMISSION MANAGEMENT
-- =====================================================

-- Employee role assignments (employees can have multiple roles)
CREATE TABLE IF NOT EXISTS employee_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  assigned_by INTEGER NOT NULL, -- User who assigned the role
  assigned_at DATETIME NOT NULL DEFAULT (datetime('now')),
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE(employee_id, role_id)
);

-- Individual employee permissions (overrides role permissions)
CREATE TABLE IF NOT EXISTS employee_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  granted INTEGER NOT NULL, -- 1 = granted, 0 = denied (overrides role)
  granted_by INTEGER NOT NULL, -- User who granted/denied the permission
  granted_at DATETIME NOT NULL DEFAULT (datetime('now')),
  expires_at DATETIME, -- Optional expiration
  reason TEXT, -- Reason for granting/denying
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE RESTRICT,
  UNIQUE(employee_id, permission_id)
);

-- =====================================================
-- AUDIT AND LOGGING
-- =====================================================

-- Permission audit log
CREATE TABLE IF NOT EXISTS permission_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  permission_key TEXT NOT NULL,
  action TEXT NOT NULL, -- 'granted', 'denied', 'revoked'
  old_value INTEGER, -- Previous permission state
  new_value INTEGER, -- New permission state
  changed_by INTEGER NOT NULL,
  reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource_id, action_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_employee_roles_employee ON employee_roles(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_roles_role ON employee_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_employee_permissions_employee ON employee_permissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_permissions_permission ON employee_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_employee ON permission_audit_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_created ON permission_audit_log(created_at);

-- =====================================================
-- VIEWS FOR EASY QUERYING
-- =====================================================

-- View to get all permissions for an employee (combining roles and individual permissions)
CREATE VIEW IF NOT EXISTS employee_effective_permissions AS
SELECT DISTINCT
  e.id as employee_id,
  e.full_name as employee_name,
  p.permission_key,
  p.display_name as permission_display_name,
  sr.name as resource_name,
  sr.display_name as resource_display_name,
  sa.name as action_name,
  sa.display_name as action_display_name,
  CASE 
    WHEN ep.granted IS NOT NULL THEN ep.granted
    ELSE COALESCE(MAX(rp.granted), 0)
  END as has_permission,
  CASE 
    WHEN ep.granted IS NOT NULL THEN 'individual'
    ELSE 'role'
  END as permission_source
FROM employees e
LEFT JOIN employee_roles er ON e.id = er.employee_id AND er.is_active = 1
LEFT JOIN role_permissions rp ON er.role_id = rp.role_id AND rp.granted = 1
LEFT JOIN permissions p ON (rp.permission_id = p.id OR p.id IN (
  SELECT ep2.permission_id FROM employee_permissions ep2 
  WHERE ep2.employee_id = e.id AND ep2.is_active = 1
))
LEFT JOIN employee_permissions ep ON e.id = ep.employee_id AND p.id = ep.permission_id AND ep.is_active = 1
LEFT JOIN system_resources sr ON p.resource_id = sr.id
LEFT JOIN system_actions sa ON p.action_id = sa.id
WHERE e.status = 'active' AND p.is_active = 1
GROUP BY e.id, p.id;
