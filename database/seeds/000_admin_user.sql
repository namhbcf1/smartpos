-- Seed Admin User
-- Password: admin123 (hashed with bcrypt)

-- Insert default admin user
-- Password hash for 'admin123': $2a$10$X4i5zCKZDQIwZBBH9VvLTuGYLV5rGVBt7yLPrPzJX3hk3Q3vJ0XKW
INSERT OR IGNORE INTO users (
  id,
  username,
  password_hash,
  email,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'user-admin-001',
  'admin',
  '$2a$10$X4i5zCKZDQIwZBBH9VvLTuGYLV5rGVBt7yLPrPzJX3hk3Q3vJ0XKW',
  'admin@smartpos.local',
  'Administrator',
  'admin',
  1,
  datetime('now'),
  datetime('now')
);

-- Insert demo manager user
-- Password: manager123
INSERT OR IGNORE INTO users (
  id,
  username,
  password_hash,
  email,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'user-manager-001',
  'manager',
  '$2a$10$kQZ.vYHQwJYWxBGF3MoXzOjXL3vIFf5rQw0kGZ2VqWqL3IxQyLKHe',
  'manager@smartpos.local',
  'Store Manager',
  'manager',
  1,
  datetime('now'),
  datetime('now')
);

-- Insert demo staff user
-- Password: staff123
INSERT OR IGNORE INTO users (
  id,
  username,
  password_hash,
  email,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'user-staff-001',
  'staff',
  '$2a$10$2fqFZJ4bYx5gKQw5x9qNKeR3F7Hq5zV0WXgZ4Y8aIqKjLmNoPqRsW',
  'staff@smartpos.local',
  'Sales Staff',
  'staff',
  1,
  datetime('now'),
  datetime('now')
);
