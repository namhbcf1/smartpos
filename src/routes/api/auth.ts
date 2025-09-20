import { Hono } from 'hono';
import { Env, ApiResponse } from '../../types';
import { authenticate, getUser } from '../../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Health check endpoint
app.get('/health', async (c: any) => {
  try {
    // Check if users table exists and has admin user
    const userCount = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM users`).first();
    const adminUser = await c.env.DB.prepare(`SELECT username FROM users WHERE username = 'admin'`).first();

    return c.json({
      success: true,
      database: 'connected',
      users_count: userCount?.count || 0,
      admin_exists: !!adminUser,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({
      success: false,
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Login endpoint
app.post('/login', async (c: any) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    if (!username || !password) {
      return c.json({
        success: false,
        message: 'Username and password required'
      }, 400);
    }

    // Log login attempt for security
    await c.env.DB.prepare(`
      INSERT INTO login_attempts (username, success, ip_address, user_agent, created_at)
      VALUES (?, 0, ?, ?, CURRENT_TIMESTAMP)
    `).bind(username, c.req.header('cf-connecting-ip') || 'unknown', c.req.header('user-agent') || 'unknown').run().catch(() => {});

    // Get user from database
    const user = await c.env.DB.prepare(`
      SELECT id, username, email, full_name, role, is_active, password_hash, store_id, last_login_at
      FROM users
      WHERE (username = ? OR email = ?) AND is_active = 1
    `).bind(username, username).first();

    if (!user) {
      return c.json({
        success: false,
        message: 'Invalid credentials'
      }, 401);
    }

    // Verify password
    let isValidPassword = false;
    let passwordMethod = '';

    const passwordHash = user.password_hash as string;

    // Check if password is a bcrypt hash (starts with $2a$, $2b$, or $2y$)
    if (passwordHash.startsWith('$2a$') || passwordHash.startsWith('$2b$') || passwordHash.startsWith('$2y$')) {
      try {
        const bcrypt = await import('bcryptjs');
        isValidPassword = await bcrypt.compare(password, passwordHash);
        passwordMethod = 'bcrypt';
      } catch (bcryptError) {
        passwordMethod = 'bcrypt-error';
        isValidPassword = false;
      }
    } else {
      // Plain text comparison for initial setup
      isValidPassword = passwordHash === password;
      passwordMethod = 'plaintext';
    }

    if (!isValidPassword) {
      return c.json({
        success: false,
        message: 'Invalid credentials'
      }, 401);
    }

    // Generate JWT token
    const { sign } = await import('hono/jwt');
    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
      return c.json({
        success: false,
        message: 'Server configuration error'
      }, 500);
    }

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      store: user.store_id || 1,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    const token = await sign(payload, jwtSecret);

    // Create session record
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await c.env.DB.prepare(`
      INSERT INTO auth_sessions (id, user_id, token, expires_at, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, datetime('now', '+24 hours'), ?, ?, CURRENT_TIMESTAMP)
    `).bind(sessionId, user.id, token, c.req.header('cf-connecting-ip') || 'unknown', c.req.header('user-agent') || 'unknown').run().catch(() => {});

    // Update user login stats
    await c.env.DB.prepare(`
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(user.id).run().catch(() => {});

    // Log successful attempt
    await c.env.DB.prepare(`
      UPDATE login_attempts
      SET success = 1
      WHERE username = ? AND created_at = (SELECT MAX(created_at) FROM login_attempts WHERE username = ?)
    `).bind(username, username).run().catch(() => {});

    // Set secure cookie
    const cookieOptions = [
      `auth_token=${token}`,
      'HttpOnly',
      'Path=/',
      'SameSite=None',
      'Secure',
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
          full_name: user.full_name || '',
          role: user.role,
          store_id: user.store_id || 1
        },
        token: token,
        session_id: sessionId
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: process.env.NODE_ENV === 'development' ? {
        error: error,
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
    }, 500);
  }
});

// Logout endpoint
app.post('/logout', authenticate, async (c: any) => {
  try {
    const user = getUser(c);
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Deactivate session
      await c.env.DB.prepare(`
        UPDATE auth_sessions
        SET is_active = 0, updated_at = CURRENT_TIMESTAMP
        WHERE token = ? AND user_id = ?
      `).bind(token, user.id).run().catch(() => {});
    }

    // Clear cookie
    c.header('Set-Cookie', 'auth_token=; HttpOnly; Path=/; SameSite=None; Secure; Max-Age=0');

    return c.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Logout failed'
    }, 500);
  }
});

// Get current user profile
app.get('/me', authenticate, async (c: any) => {
  try {
    const user = getUser(c);

    const userData = await c.env.DB.prepare(`
      SELECT
        id, username, email, full_name, role, store_id, is_active,
        last_login_at, login_count, avatar_url, phone, created_at
      FROM users
      WHERE id = ?
    `).bind(user.id).first();

    if (!userData) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404);
    }

    // Get user's store info
    const storeInfo = await c.env.DB.prepare(`
      SELECT id, name, code, address, phone, email
      FROM stores
      WHERE id = ?
    `).bind(userData.store_id || 1).first();

    return c.json({
      success: true,
      data: {
        ...userData,
        store: storeInfo || null
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Failed to get user profile'
    }, 500);
  }
});

// Update user profile
app.put('/me', authenticate, async (c: any) => {
  try {
    const user = getUser(c);
    const body = await c.req.json();
    const { full_name, email, phone } = body;

    await c.env.DB.prepare(`
      UPDATE users
      SET full_name = COALESCE(?, full_name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(full_name, email, phone, user.id).run();

    return c.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Failed to update profile'
    }, 500);
  }
});

// Change password
app.put('/change-password', authenticate, async (c: any) => {
  try {
    const user = getUser(c);
    const { current_password, new_password } = await c.req.json();

    if (!current_password || !new_password) {
      return c.json({
        success: false,
        message: 'Current password and new password are required'
      }, 400);
    }

    // Get current user
    const userData = await c.env.DB.prepare(`
      SELECT password_hash FROM users WHERE id = ?
    `).bind(user.id).first();

    if (!userData) {
      return c.json({
        success: false,
        message: 'User not found'
      }, 404);
    }

    // Verify current password
    let isCurrentValid = false;
    try {
      const bcrypt = await import('bcryptjs');
      isCurrentValid = await bcrypt.compare(current_password, userData.password_hash as string);
    } catch {
      isCurrentValid = userData.password_hash === current_password;
    }

    if (!isCurrentValid) {
      return c.json({
        success: false,
        message: 'Current password is incorrect'
      }, 400);
    }

    // Hash new password
    let hashedPassword = new_password;
    try {
      const bcrypt = await import('bcryptjs');
      hashedPassword = await bcrypt.hash(new_password, 12);
    } catch {
      // Fallback to plain text if bcrypt fails
    }

    // Update password
    await c.env.DB.prepare(`
      UPDATE users
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(hashedPassword, user.id).run();

    // Deactivate all sessions except current
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const currentToken = authHeader.substring(7);
      await c.env.DB.prepare(`
        UPDATE auth_sessions
        SET is_active = 0
        WHERE user_id = ? AND token != ?
      `).bind(user.id, currentToken).run().catch(() => {});
    }

    return c.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Failed to change password'
    }, 500);
  }
});

// Register new user (admin only)
app.post('/register', authenticate, async (c: any) => {
  try {
    const currentUser = getUser(c);

    if (currentUser.role !== 'admin') {
      return c.json({
        success: false,
        message: 'Only administrators can register new users'
      }, 403);
    }

    const { username, email, password, full_name, role = 'staff', store_id } = await c.req.json();

    if (!username || !email || !password) {
      return c.json({
        success: false,
        message: 'Username, email, and password are required'
      }, 400);
    }

    // Check if user already exists
    const existingUser = await c.env.DB.prepare(`
      SELECT id FROM users WHERE username = ? OR email = ?
    `).bind(username, email).first();

    if (existingUser) {
      return c.json({
        success: false,
        message: 'User with this username or email already exists'
      }, 400);
    }

    // Hash password
    let hashedPassword = password;
    try {
      const bcrypt = await import('bcryptjs');
      hashedPassword = await bcrypt.hash(password, 12);
    } catch {
      // Fallback to plain text if bcrypt fails
    }

    // Create user
    const userId = Date.now();
    await c.env.DB.prepare(`
      INSERT INTO users (
        id, username, email, password_hash, full_name, role, store_id,
        is_active, created_at, updated_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
    `).bind(userId, username, email, hashedPassword, full_name, role, store_id || 1, currentUser.id).run();

    return c.json({
      success: true,
      data: {
        id: userId,
        username,
        email,
        full_name,
        role,
        store_id: store_id || 1
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Registration failed'
    }, 500);
  }
});

// Get all users (admin only)
app.get('/users', authenticate, async (c: any) => {
  try {
    const currentUser = getUser(c);

    if (currentUser.role !== 'admin') {
      return c.json({
        success: false,
        message: 'Only administrators can view all users'
      }, 403);
    }

    const { page = '1', limit = '50', role, store_id, search } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (store_id) {
      whereClause += ' AND store_id = ?';
      params.push(store_id);
    }

    if (search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const users = await c.env.DB.prepare(`
      SELECT
        id, username, email, full_name, role, store_id, is_active,
        last_login_at, login_count, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, parseInt(limit), offset).all();

    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM users ${whereClause}
    `).bind(...params).first();

    return c.json({
      success: true,
      data: users.results || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalResult?.total || 0,
        pages: Math.ceil((totalResult?.total || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Failed to get users'
    }, 500);
  }
});

// Update user role (admin only)
app.put('/users/:id/role', authenticate, async (c: any) => {
  try {
    const currentUser = getUser(c);

    if (currentUser.role !== 'admin') {
      return c.json({
        success: false,
        message: 'Only administrators can update user roles'
      }, 403);
    }

    const userId = c.req.param('id');
    const { role } = await c.req.json();

    if (!['admin', 'manager', 'cashier', 'sales_agent', 'inventory', 'staff'].includes(role)) {
      return c.json({
        success: false,
        message: 'Invalid role'
      }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE users
      SET role = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
      WHERE id = ?
    `).bind(role, currentUser.id, userId).run();

    return c.json({
      success: true,
      message: 'User role updated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Failed to update user role'
    }, 500);
  }
});

// Deactivate user (admin only)
app.put('/users/:id/deactivate', authenticate, async (c: any) => {
  try {
    const currentUser = getUser(c);

    if (currentUser.role !== 'admin') {
      return c.json({
        success: false,
        message: 'Only administrators can deactivate users'
      }, 403);
    }

    const userId = c.req.param('id');

    if (userId === currentUser.id.toString()) {
      return c.json({
        success: false,
        message: 'Cannot deactivate your own account'
      }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE users
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP, updated_by = ?
      WHERE id = ?
    `).bind(currentUser.id, userId).run();

    // Deactivate all sessions for this user
    await c.env.DB.prepare(`
      UPDATE auth_sessions
      SET is_active = 0
      WHERE user_id = ?
    `).bind(userId).run().catch(() => {});

    return c.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Failed to deactivate user'
    }, 500);
  }
});

export default app;