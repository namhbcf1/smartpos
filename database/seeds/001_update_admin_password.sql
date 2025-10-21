-- Update admin password with correct bcrypt hash
-- Password: admin123

UPDATE users
SET password_hash = '$2a$10$EyFExLF503CF8ig0EyhNh.q1Mdkx6zCzqq/.iY.R96iSQtN/U9dRW'
WHERE username = 'admin';
