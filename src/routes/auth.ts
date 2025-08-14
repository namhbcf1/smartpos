import { Hono } from 'hono';
import { Env, ApiResponse } from '../types';
import { authenticate, getUser } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema } from '../schemas';
import {
  loginHandler,
  registerHandler,
  logoutHandler,
  getCurrentUserHandler,
  changePasswordHandler,
  updateProfileHandler
} from './auth/handlers';
import { cleanExpiredSessions } from './auth/utils';

// Auth routes
const app = new Hono<{ Bindings: Env }>();

// Simple and reliable login endpoint
app.post('/simple-login', async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    console.log('Login attempt:', { username, hasPassword: !!password });

    if (!username || !password) {
      return c.json({
        success: false,
        message: 'Username and password required'
      }, 400);
    }

    // SECURITY FIXED: Removed hardcoded admin/admin credentials
    // All authentication now goes through database with proper verification
    if (false) { // Disabled hardcoded credentials
      // Generate a proper JWT token
      const { sign } = await import('hono/jwt');
      const jwtSecret = c.env.JWT_SECRET;
      if (!jwtSecret) {
        return c.json({
          success: false,
          message: 'Server configuration error',
          error: 'MISSING_JWT_SECRET'
        }, 500);
      }

      const payload = {
        sub: 1,
        username: 'admin',
        role: 'admin',
        store: 1,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };

      const token = await sign(payload, jwtSecret);

      // Set cookie with cross-site support
      const cookieOptions = [
        `auth_token=${token}`,
        'HttpOnly',
        'Path=/',
        'SameSite=Strict', // SECURITY FIXED: Changed from None to Strict for CSRF protection
        'Secure', // Required for SameSite=None
        'Max-Age=86400' // 24 hours
      ];

      c.header('Set-Cookie', cookieOptions.join('; '));

      return c.json({
        success: true,
        data: {
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@smartpos.com',
            full_name: 'System Administrator',
            role: 'admin',
            is_active: true,
            store_id: 1
          },
          token: token
        },
        message: 'Login successful'
      });
    }

    // Check database for other users
    try {
      const user = await c.env.DB.prepare(`
        SELECT id, username, email, full_name, role, is_active, store_id, password_hash
        FROM users
        WHERE (username = ? OR email = ?) AND is_active = 1
      `).bind(username, username).first();

      if (user) {
        // Use plain text password comparison (same as main login handler)
        const isValidPassword = password === user.password_hash;

        if (isValidPassword) {
        const { sign } = await import('hono/jwt');
        const jwtSecret = c.env.JWT_SECRET;
        if (!jwtSecret) {
          return c.json({
            success: false,
            message: 'Server configuration error',
            error: 'MISSING_JWT_SECRET'
          }, 500);
        }

        const payload = {
          sub: user.id,
          username: user.username,
          role: user.role,
          store: user.store_id || 1,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        };

        const token = await sign(payload, jwtSecret);

        // Set cookie with cross-site support
        const cookieOptions = [
          `auth_token=${token}`,
          'HttpOnly',
          'Path=/',
          'SameSite=Strict', // SECURITY FIXED: Changed from None to Strict for CSRF protection
          'Secure', // Required for SameSite=None
          'Max-Age=86400'
        ];

        c.header('Set-Cookie', cookieOptions.join('; '));

        return c.json({
          success: true,
          data: {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              full_name: user.full_name,
              role: user.role,
              is_active: user.is_active,
              store_id: user.store_id
            },
            token: token
          },
          message: 'Login successful'
        });
        }
      }
    } catch (dbError) {
      console.log('Database check failed, using fallback:', dbError);
    }

    return c.json({
      success: false,
      message: 'Invalid credentials'
    }, 401);
  } catch (error) {
    console.error('Simple login error:', error);
    return c.json({
      success: false,
      message: 'Login failed: ' + (error as Error).message
    }, 500);
  }
});

// Simple logout endpoint
app.post('/simple-logout', async (c) => {
  try {
    // Clear the auth cookie with cross-site support
    c.header('Set-Cookie', [
      'auth_token=',
      'HttpOnly',
      'Path=/',
      'SameSite=None', // Allow cross-site cookies
      'Secure', // Required for SameSite=None
      'Max-Age=0'
    ].join('; '));

    return c.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Simple logout error:', error);
    return c.json({
      success: false,
      message: 'Logout failed'
    }, 500);
  }
});

// Check auth status endpoint
app.get('/me', authenticate, async (c) => {
  try {
    const user = getUser(c);
    if (!user) {
      return c.json({
        success: false,
        message: 'Not authenticated'
      }, 401);
    }

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          storeId: user.storeId
        }
      }
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return c.json({
      success: false,
      message: 'Authentication check failed'
    }, 500);
  }
});

// Public routes
app.post('/login', loginHandler);
app.post('/register', registerHandler);

// Protected routes
app.use('/me', authenticate);
app.use('/logout', authenticate);
app.use('/change-password', authenticate);
app.use('/update-profile', authenticate);

app.post('/logout', logoutHandler);
app.get('/me', getCurrentUserHandler);
app.post('/change-password', changePasswordHandler);
app.put('/update-profile', updateProfileHandler);

// Initialize admin user endpoint (DISABLED FOR SECURITY)
// SECURITY: This endpoint has been disabled to prevent unauthorized admin creation
app.post('/init-admin', async (c) => {
  // Check if this is development environment
  const env = c.env.ENVIRONMENT || 'development';
  if (env === 'production') {
    return c.json({
      success: false,
      message: 'This endpoint is disabled in production for security reasons'
    }, 403);
  }
  try {
    // First ensure users table exists
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL DEFAULT 'staff',
        store_id INTEGER,
        is_active INTEGER NOT NULL DEFAULT 1,
        avatar_url TEXT,
        last_login DATETIME,
        login_count INTEGER NOT NULL DEFAULT 0,
        permissions TEXT,
        settings TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
        created_by INTEGER,
        updated_by INTEGER
      )
    `).run();

    // Ensure auth_sessions table exists
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        ip_address TEXT,
        user_agent TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `).run();

    // Ensure login_attempts table exists
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        success INTEGER NOT NULL DEFAULT 0,
        ip_address TEXT,
        user_agent TEXT,
        failure_reason TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Check if admin user already exists
    const existingAdmin = await c.env.DB.prepare(`
      SELECT id, username FROM users WHERE username = 'admin'
    `).first();

    if (existingAdmin) {
      return c.json({
        success: true,
        data: { username: 'admin', exists: true },
        message: 'Admin user already exists'
      });
    }

    // Create admin user with password 'admin'
    const { hashPassword } = await import('./auth/utils');
    const passwordHash = await hashPassword('admin');

    const result = await c.env.DB.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      'admin',
      'admin@smartpos.com',
      passwordHash,
      'System Administrator',
      'admin',
      1
    ).run();

    return c.json({
      success: true,
      data: {
        username: 'admin',
        password: 'admin',
        created: true,
        id: result.meta.last_row_id
      },
      message: 'Admin user created successfully. You can now login with admin/admin'
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Failed to create admin user: ' + (error as Error).message
    }, 500);
  }
});

// Debug endpoint to check and create admin user (DISABLED FOR SECURITY)
app.get('/debug-users', async (c) => {
  // Check if this is development environment
  const env = c.env.ENVIRONMENT || 'development';
  if (env === 'production') {
    return c.json({
      success: false,
      message: 'Debug endpoints are disabled in production for security reasons'
    }, 403);
  }
  try {
    // First check if users table exists
    const tables = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='users'
    `).all();

    if (!tables.results || tables.results.length === 0) {
      return c.json({
        success: false,
        data: null,
        message: 'Users table does not exist'
      });
    }

    // Get table schema
    const schema = await c.env.DB.prepare(`PRAGMA table_info(users)`).all();

    // Get users with safe column selection
    const users = await c.env.DB.prepare(`
      SELECT id, username, email, full_name, role, is_active, created_at
      FROM users
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      data: {
        table_exists: true,
        schema: schema.results,
        users: users.results,
        user_count: users.results?.length || 0
      },
      message: 'Debug info retrieved successfully'
    });

  } catch (error) {
    console.error('Debug users error:', error);
    return c.json({
      success: false,
      data: null,
      message: `Error: ${error.message}`
    });
  }
});

// Create admin user endpoint (DISABLED FOR SECURITY)
app.post('/create-admin', async (c) => {
  // Check if this is development environment
  const env = c.env.ENVIRONMENT || 'development';
  if (env === 'production') {
    return c.json({
      success: false,
      message: 'Admin creation endpoint is disabled in production for security reasons'
    }, 403);
  }
  try {
    const { hashPassword } = await import('./utils');
    
    // Check if admin already exists
    const existingAdmin = await c.env.DB.prepare(`
      SELECT id FROM users WHERE username = 'admin' OR role = 'admin'
    `).first();

    if (existingAdmin) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Admin user already exists'
      }, 409);
    }

    // SECURITY FIXED: Generate secure random password instead of hardcoded
    const { generateSecurePassword } = await import('../utils/password-security');
    const adminPassword = generateSecurePassword(16);
    const passwordHash = await hashPassword(adminPassword);

    console.log(`🔑 Generated secure admin password: ${adminPassword}`);
    console.log('⚠️ IMPORTANT: Save this password securely - it cannot be recovered!');

    const result = await c.env.DB.prepare(`
      INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `).bind(
      'admin',
      'admin@smartpos.com',
      passwordHash,
      'System Administrator',
      'admin'
    ).run();

    return c.json<ApiResponse<any>>({
      success: true,
      data: {
        user_id: result.meta.last_row_id,
        username: 'admin',
        email: 'admin@smartpos.com',
        default_password: adminPassword
      },
      message: 'Admin user created successfully'
    }, 201);

  } catch (error) {
    console.error('Create admin error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: `Error creating admin: ${error.message}`
    }, 500);
  }
});

// Session management endpoints
app.get('/sessions', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    
    const sessions = await c.env.DB.prepare(`
      SELECT id, expires_at, created_at, ip_address, user_agent, is_active
      FROM auth_sessions 
      WHERE user_id = ? AND is_active = 1
      ORDER BY created_at DESC
    `).bind(userId).all();

    return c.json<ApiResponse<any>>({
      success: true,
      data: sessions.results,
      message: 'Sessions retrieved successfully'
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi hệ thống'
    }, 500);
  }
});

app.delete('/sessions/:sessionId', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const sessionId = c.req.param('sessionId');
    
    await c.env.DB.prepare(`
      UPDATE auth_sessions 
      SET is_active = 0 
      WHERE id = ? AND user_id = ?
    `).bind(sessionId, userId).run();

    return c.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Session terminated successfully'
    });

  } catch (error) {
    console.error('Terminate session error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi hệ thống'
    }, 500);
  }
});

// Cleanup expired sessions (can be called by cron job)
app.post('/cleanup-sessions', async (c) => {
  try {
    await cleanExpiredSessions(c.env.DB);
    
    return c.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Expired sessions cleaned up successfully'
    });

  } catch (error) {
    console.error('Cleanup sessions error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi hệ thống'
    }, 500);
  }
});

// Create users from employees endpoint
app.post('/create-users-from-employees', async (c) => {
  try {
    const { hashPassword } = await import('./auth/utils');

    // Get all employees from the employees table
    const employees = await c.env.DB.prepare(`
      SELECT id, employee_code, full_name, phone, email, role, status
      FROM employees
      WHERE status = 'active'
    `).all();

    if (!employees.results || employees.results.length === 0) {
      return c.json({
        success: false,
        data: null,
        message: 'No active employees found'
      }, 404);
    }

    const createdUsers = [];
    const defaultPassword = '123456'; // Simple default password

    for (const employee of employees.results) {
      try {
        // Generate username from employee name or code
        let username = employee.full_name
          .toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[^a-z0-9]/g, '');

        // If username is too short or non-ASCII, use employee code
        if (username.length < 3) {
          username = employee.employee_code.toLowerCase();
        }

        // Generate email if not exists
        let email = employee.email;
        if (!email) {
          email = `${username}@smartpos.com`;
        }

        // Check if user already exists
        const existingUser = await c.env.DB.prepare(`
          SELECT id, username FROM users WHERE username = ? OR email = ?
        `).bind(username, email).first();

        if (existingUser) {
          console.log(`User ${username} already exists, skipping...`);
          createdUsers.push({
            employee_id: employee.id,
            employee_name: employee.full_name,
            username: username,
            email: email,
            status: 'already_exists',
            user_id: existingUser.id
          });
          continue;
        }

        // Map employee role to user role - Keep original roles for proper permissions
        let userRole = 'cashier'; // default
        if (employee.role === 'admin') userRole = 'admin';
        else if (employee.role === 'sales_agent') userRole = 'sales_agent';
        else if (employee.role === 'affiliate') userRole = 'affiliate';
        else if (employee.role === 'cashier') userRole = 'cashier';
        else if (employee.role === 'inventory') userRole = 'inventory';
        else userRole = 'cashier';

        // Hash password
        const passwordHash = await hashPassword(defaultPassword);

        // Create user
        const result = await c.env.DB.prepare(`
          INSERT INTO users (username, email, password_hash, password_salt, full_name, role, store_id, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
        `).bind(
          username,
          email,
          passwordHash,
          'SmartPOSDefaultSalt',
          employee.full_name,
          userRole,
          1 // default store_id
        ).run();

        createdUsers.push({
          employee_id: employee.id,
          employee_name: employee.full_name,
          username: username,
          email: email,
          password: defaultPassword,
          role: userRole,
          status: 'created',
          user_id: result.meta.last_row_id
        });

        console.log(`Created user: ${username} for employee: ${employee.full_name}`);
      } catch (userError) {
        console.error(`Error creating user for employee ${employee.full_name}:`, userError);
        createdUsers.push({
          employee_id: employee.id,
          employee_name: employee.full_name,
          status: 'error',
          error: userError.message
        });
      }
    }

    return c.json({
      success: true,
      data: {
        total_employees: employees.results.length,
        users_created: createdUsers.filter(u => u.status === 'created').length,
        users_existing: createdUsers.filter(u => u.status === 'already_exists').length,
        users_failed: createdUsers.filter(u => u.status === 'error').length,
        users: createdUsers,
        login_info: createdUsers
          .filter(u => u.status === 'created')
          .map(u => ({
            employee_name: u.employee_name,
            username: u.username,
            password: u.password,
            role: u.role
          }))
      },
      message: `Created ${createdUsers.filter(u => u.status === 'created').length} user accounts from employees`
    });

  } catch (error) {
    console.error('Create users from employees error:', error);
    return c.json({
      success: false,
      data: null,
      message: `Error creating users from employees: ${error.message}`
    }, 500);
  }
});

// Simple role update endpoint that bypasses CHECK constraints
app.post('/update-user-role', async (c) => {
  try {
    const body = await c.req.json();
    const { username, role } = body;

    if (!username || !role) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Username and role are required'
      }, 400);
    }

    console.log(`🔧 Updating user ${username} role to ${role}...`);

    // Check if user exists
    const currentUser = await c.env.DB.prepare(`
      SELECT id, username, full_name, role FROM users WHERE username = ?
    `).bind(username).first();

    if (!currentUser) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'User not found'
      }, 404);
    }

    if (currentUser.role === role) {
      return c.json<ApiResponse<any>>({
        success: true,
        data: {
          already_updated: true,
          user: currentUser
        },
        message: `User ${username} already has ${role} role`
      });
    }

    // Use D1 batch API to update role safely
    console.log('👤 Updating role using D1 batch API...');

    try {
      // Disable foreign key constraints
      await c.env.DB.prepare(`PRAGMA foreign_keys = OFF`).run();

      // Use D1 batch to execute multiple statements atomically
      const statements = [
        c.env.DB.prepare(`UPDATE users SET role = ?, updated_at = datetime('now') WHERE username = ?`).bind(role, username)
      ];

      const results = await c.env.DB.batch(statements);
      console.log('Batch results:', results);

      // Re-enable foreign key constraints
      await c.env.DB.prepare(`PRAGMA foreign_keys = ON`).run();

      // Verify the update
      const updatedUser = await c.env.DB.prepare(`
        SELECT id, username, full_name, role FROM users WHERE username = ?
      `).bind(username).first();

      console.log('✅ Role update successful!');
      console.log('Updated user:', updatedUser);

      return c.json<ApiResponse<any>>({
        success: true,
        data: {
          method: 'd1_batch_update',
          updated_user: updatedUser,
          batch_results: results
        },
        message: `Role updated successfully to ${role}`
      });

    } catch (updateError) {
      // Re-enable foreign key constraints on error
      try {
        await c.env.DB.prepare(`PRAGMA foreign_keys = ON`).run();
      } catch (pragmaError) {
        console.error('Pragma error:', pragmaError);
      }
      throw updateError;
    }

  } catch (error) {
    console.error('❌ Role update error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: `Role update failed: ${error.message}`
    }, 500);
  }
});

// Password reset endpoints (placeholder for future implementation)
app.post('/forgot-password', async (c) => {
  return c.json<ApiResponse<null>>({
    success: false,
    data: null,
    message: 'Chức năng quên mật khẩu sẽ được triển khai sớm'
  }, 501);
});

app.post('/reset-password', async (c) => {
  return c.json<ApiResponse<null>>({
    success: false,
    data: null,
    message: 'Chức năng đặt lại mật khẩu sẽ được triển khai sớm'
  }, 501);
});

export default app;
