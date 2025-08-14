import { Hono } from 'hono';
import { Env } from '../types';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLogger } from '../middleware/security';
// import { generateRandomSalt, hashPassword } from '../utils/crypto';
import { z } from 'zod';
import { CacheManager, CacheKeys, CacheConfigs } from '../utils/cache';

const app = new Hono<{ Bindings: Env }>();

// Initialize users table if not exists
async function initUsersTable(db: any) {
  try {
    // Drop existing table to avoid constraint issues
    await db.prepare('DROP TABLE IF EXISTS users').run();

    // Create fresh table
    await db.prepare(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT,
        role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'inventory')),
        store_id INTEGER DEFAULT 1,
        is_active INTEGER NOT NULL DEFAULT 1,
        last_login_at TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      )
    `).run();

    console.log('Users table recreated successfully');
    return true;
  } catch (error) {
    console.error('Error initializing users table:', error);
    throw error;
  }
}

// Create default admin user
async function createDefaultAdmin(db: any) {
  try {
    console.log('Creating admin user...');

    // Create admin with correct password
    const password_salt = 'smartpos_salt';
    const password_hash = 'admin'; // Plain password matching login

    await db.prepare(`
      INSERT INTO users (username, email, password_hash, password_salt, full_name, role, store_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      'admin',
      'admin@smartpos.vn',
      password_hash,
      password_salt,
      'Administrator',
      'admin',
      1,
      1
    ).run();

    console.log('Admin user created successfully');
    return true;
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
}

// Simple endpoint to create admin without dropping table
app.get('/create-admin', async (c) => {
  try {
    // Just insert admin user
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO users (id, username, email, password_hash, password_salt, full_name, role, store_id, is_active)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      'admin',
      'admin@smartpos.vn',
      'admin', // Plain password
      'smartpos_salt',
      'Administrator',
      'admin',
      1,
      1
    ).run();

    return c.json({
      success: true,
      message: 'Admin user created successfully'
    });
  } catch (error) {
    console.error('Create admin error:', error);
    return c.json({
      success: false,
      message: 'Create admin failed: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Public endpoint to initialize database
app.get('/init', async (c) => {
  try {
    await initUsersTable(c.env.DB);
    await createDefaultAdmin(c.env.DB);

    return c.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('Init error:', error);
    return c.json({
      success: false,
      message: 'Database initialization failed: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Debug endpoint to check users
app.get('/debug', async (c) => {
  try {
    const users = await c.env.DB.prepare(`
      SELECT id, username, email, password_hash, password_salt, full_name, role, is_active, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      data: users.results,
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Debug error:', error);
    return c.json({
      success: false,
      message: 'Debug failed: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Simple register endpoint for testing - FIXED VERSION
app.post('/register', async (c) => {
  try {
    const data = await c.req.json();
    console.log('Register data:', data);

    const { username, email, password, full_name, phone, role, store_id } = data;

    // Basic validation
    if (!username || !email || !password || !full_name) {
      return c.json({
        success: false,
        message: 'Thiếu thông tin bắt buộc'
      }, 400);
    }

    // Ensure database is initialized
    await ensureDatabaseInitialized(c.env.DB);

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    ).bind(username, email).first();

    if (existingUser) {
      return c.json({
        success: false,
        message: 'Tên đăng nhập hoặc email đã tồn tại'
      }, 400);
    }

    // Ensure all required fields have values (no undefined)
    const safeUsername = String(username).trim();
    const safeEmail = String(email).trim();
    const safePassword = String(password);
    const safeFullName = String(full_name).trim();
    const safePhone = phone ? String(phone).trim() : null;
    const safeRole = role && ['admin', 'manager', 'cashier', 'inventory'].includes(role) ? role : 'cashier';
    const safeStoreId = store_id && Number.isInteger(store_id) ? store_id : 1;

    console.log('Safe values:', {
      safeUsername,
      safeEmail,
      safePassword: '***',
      safeFullName,
      safePhone,
      safeRole,
      safeStoreId
    });

    // Insert new user with safe values
    const result = await c.env.DB.prepare(`
      INSERT INTO users (username, email, password_hash, password_salt, full_name, phone, role, store_id, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      safeUsername,
      safeEmail,
      safePassword, // Plain password for now
      'smartpos_salt',
      safeFullName,
      safePhone,
      safeRole,
      safeStoreId,
      1
    ).run();

    console.log('Insert result:', result);

    return c.json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        id: result.meta.last_row_id,
        username: safeUsername,
        email: safeEmail,
        full_name: safeFullName,
        role: safeRole
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    console.error('Error details:', {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      name: error?.name || 'Unknown error type'
    });
    return c.json({
      success: false,
      message: 'Lỗi đăng ký: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Helper function to ensure database is initialized (moved from auth.ts)
export async function ensureDatabaseInitialized(db: any) {
  try {
    // Check if users table exists
    const tableExists = await db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='users'
    `).first();

    if (!tableExists) {
      console.log('Users table does not exist, creating...');

      // Create users table
      await db.prepare(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          password_salt TEXT NOT NULL,
          full_name TEXT NOT NULL,
          email TEXT UNIQUE,
          phone TEXT,
          role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier', 'inventory')),
          store_id INTEGER NOT NULL DEFAULT 1,
          avatar_url TEXT,
          is_active INTEGER NOT NULL DEFAULT 1,
          last_login DATETIME,
          created_at DATETIME NOT NULL DEFAULT (datetime('now')),
          updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
        )
      `).run();

      console.log('Users table created successfully');
    }

    // Check if admin user exists
    const adminExists = await db.prepare(`
      SELECT id FROM users WHERE username = 'admin' OR email = 'admin@smartpos.vn'
    `).first();

    if (!adminExists) {
      console.log('Admin user does not exist, creating...');

      // Create admin user
      await db.prepare(`
        INSERT INTO users (username, email, password_hash, password_salt, full_name, role, store_id, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        'admin',
        'admin@smartpos.vn',
        'admin', // Plain password for now
        'smartpos_salt',
        'Administrator',
        'admin',
        1,
        1
      ).run();

      console.log('Admin user created successfully');
    }

  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Original register with validation (backup)
const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string(),
  phone: z.string().nullable().optional(),
  role: z.enum(['admin', 'manager', 'cashier', 'inventory']),
  store_id: z.number().int().positive(),
});

app.post('/register-validated', validate('body', registerSchema), async (c) => {
  const data = c.get('validated_body');
  const db = c.env.DB;

  try {
    // Ensure users table exists
    await initUsersTable(db);
    // Check if email already exists
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ?')
      .bind(data.email)
      .first();
    
    if (existingUser) {
      return c.json({ 
        success: false, 
        message: 'Email đã tồn tại trong hệ thống' 
      }, 409);
    }
    
    // Generate salt and hash password
    const password_salt = generateRandomSalt();
    const password_hash = await hashPassword(data.password, password_salt);
    
    // Create new user
    const result = await db.prepare(`
      INSERT INTO users (
        username, email, password_hash, password_salt, full_name, phone, role, store_id, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `)
    .bind(
      data.username,
      data.email, 
      password_hash,
      password_salt,
      data.full_name,
      data.phone || null,
      data.role,
      data.store_id
    )
    .run();
    
    if (!result.success) {
      throw new Error('Database error while creating user');
    }
    
    // Clear user cache
    const cache = CacheManager.getInstance();
    await cache.clearByTags(c.env, ['users']);
    
    // Log the action
    await auditLogger(c, 'user_created', { user_id: result.meta?.last_row_id, email: data.email });
    
    return c.json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: { 
        id: result.meta?.last_row_id,
        username: data.username,
        email: data.email,
        full_name: data.full_name
      }
    }, 201);
    
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại sau.' 
    }, 500);
  }
});

// Initialize admin account for new installations
const initAdminSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string(),
  phone: z.string().nullable().optional(),
  initKey: z.string().optional(),
});

app.post('/init-admin', validate('body', initAdminSchema), async (c) => {
  const data = c.get('validated_body');
  const db = c.env.DB;

  try {
    // Check if any users exist
    const existingUsers = await db.prepare('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL').first();
    
    if (existingUsers && existingUsers.count > 0) {
      return c.json({ 
        success: false, 
        message: 'Tài khoản quản trị đã tồn tại' 
      }, 403);
    }
    
    // Generate salt and hash password
    const password_salt = generateRandomSalt();
    const password_hash = await hashPassword(data.password, password_salt);
    
    // Create admin user
    const result = await db.prepare(`
      INSERT INTO users (
        username, email, password_hash, password_salt, full_name, phone, role, store_id, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'admin', 1, 1, datetime('now'))
    `)
    .bind(
      data.username,
      data.email, 
      password_hash,
      password_salt,
      data.full_name,
      data.phone || null
    )
    .run();
    
    if (!result.success) {
      throw new Error('Database error while creating admin user');
    }
    
    // Log the action
    await auditLogger(c, 'admin_user_initialized', { user_id: result.meta?.last_row_id, email: data.email });
    
    return c.json({
      success: true,
      message: 'Tạo tài khoản quản trị viên thành công',
      data: { 
        id: result.meta?.last_row_id,
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        role: 'admin'
      }
    }, 201);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    return c.json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi tạo tài khoản quản trị viên. Vui lòng thử lại sau.' 
    }, 500);
  }
});

// Direct account creation with secret key (for emergency use)
const directRegisterSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string(),
  phone: z.string().nullable().optional(),
  role: z.enum(['admin', 'manager', 'cashier', 'inventory']),
  store_id: z.number().int().positive().optional().default(1),
  secretKey: z.string()
});

app.post('/direct-register', validate('body', directRegisterSchema), async (c) => {
  const data = c.get('validated_body');
  
  // Verify secret key (this should be a strong, secure key)
  if (data.secretKey !== 'create_admin_init_key_2024') {
    return c.json({ 
      success: false, 
      message: 'Không có quyền truy cập' 
    }, 403);
  }
  
  const db = c.env.DB;

  try {
    // Check if email already exists
    const existingUser = await db.prepare('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL')
      .bind(data.email)
      .first();
    
    if (existingUser) {
      return c.json({ 
        success: false, 
        message: 'Email đã tồn tại trong hệ thống' 
      }, 409);
    }
    
    // Generate salt and hash password
    const password_salt = generateRandomSalt();
    const password_hash = await hashPassword(data.password, password_salt);
    
    // Create new user
    const result = await db.prepare(`
      INSERT INTO users (
        username, email, password_hash, password_salt, full_name, phone, role, store_id, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `)
    .bind(
      data.username,
      data.email, 
      password_hash,
      password_salt,
      data.full_name,
      data.phone || null,
      data.role,
      data.store_id
    )
    .run();
    
    if (!result.success) {
      throw new Error('Database error while creating user');
    }
    
    // Clear user cache
    const cache = CacheManager.getInstance();
    await cache.clearByTags(c.env, ['users']);
    
    // Log the action
    await auditLogger(c, 'user_created_direct', { user_id: result.meta?.last_row_id, email: data.email });
    
    return c.json({
      success: true,
      message: 'Tạo tài khoản thành công',
      data: { 
        id: result.meta?.last_row_id,
        username: data.username,
        email: data.email,
        full_name: data.full_name,
        role: data.role
      }
    }, 201);
    
  } catch (error) {
    console.error('Error creating user directly:', error);
    return c.json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại sau.' 
    }, 500);
  }
});

// Test endpoint
app.get('/test', async (c) => {
  return c.json({
    success: true,
    message: 'Users endpoint is working',
    data: null
  });
});

// Simple endpoint for frontend users list
app.get('/simple', async (c) => {
  try {
    console.log('Getting users list...');

    // Simple query first
    const users = await c.env.DB.prepare(`
      SELECT id, username, email, full_name, role, is_active, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `).all();

    console.log('Users found:', users.results?.length || 0);

    const total = users.results?.length || 0;

    return c.json({
      success: true,
      data: {
        data: users.results || [],
        pagination: {
          total,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      },
      message: 'Lấy danh sách người dùng thành công'
    });
  } catch (error) {
    console.error('Get users simple error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy danh sách người dùng: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Protected routes below this point
app.use('/*', authenticate);

app.get('/', authorize(['admin']), async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const search = c.req.query('search') || '';
  const offset = (page - 1) * limit;

  const cacheKey = CacheKeys.user(0) + `:list:${page}:${limit}:${search}`;
  const cache = CacheManager.getInstance();

  try {
    const result = await cache.getOrSet(c.env, cacheKey, async () => {
      let query = `SELECT id, username, email, full_name, phone, role, store_id, is_active FROM users WHERE deleted_at IS NULL`;
      let countQuery = `SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL`;
      const params = [];

      if (search) {
        query += ` AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)`;
        countQuery += ` AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
      }

      query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const users = await c.env.DB.prepare(query).bind(...params).all();
      const countResult = await c.env.DB.prepare(countQuery).bind(...params.slice(0, -2)).first();

      return {
        items: users.results,
        total: countResult ? countResult.total : 0,
        page,
        limit,
      };
    }, { ttl: 300, tags: ['users'] });

    return c.json({
      success: true,
      message: 'Danh sách người dùng',
      data: result,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ 
      success: false, 
      message: 'Đã xảy ra lỗi khi truy vấn danh sách người dùng' 
    }, 500);
  }
});

app.get('/:id', authorize(['admin']), async (c) => {
  const id = c.req.param('id');
  const cacheKey = CacheKeys.user(parseInt(id));
  const cache = CacheManager.getInstance();

  try {
    const result = await cache.getOrSet(c.env, cacheKey, async () => {
      const user = await c.env.DB.prepare(`
        SELECT id, username, email, full_name, phone, role, store_id, is_active, created_at, updated_at
        FROM users WHERE id = ? AND deleted_at IS NULL
      `).bind(id).first();

      if (!user) {
        throw new Error('NOT_FOUND');
      }

      return user;
    }, { ttl: 600, tags: ['users'] });

    return c.json({
      success: true,
      message: 'Thông tin người dùng',
      data: result,
    });
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return c.json({
        success: false,
        message: 'Không tìm thấy người dùng',
      }, 404);
    }

    return c.json({
      success: false,
      message: 'Đã xảy ra lỗi khi truy vấn thông tin người dùng',
    }, 500);
  }
});

// More routes (PUT, DELETE) would go here...

// Simple GET endpoint for frontend compatibility
app.get('/simple', authenticate, async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const search = c.req.query('search') || '';
    const role = c.req.query('role') || '';
    const status = c.req.query('status') || '';

    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (status === 'active') {
      whereClause += ' AND is_active = 1';
    } else if (status === 'inactive') {
      whereClause += ' AND is_active = 0';
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    // Get users (exclude sensitive fields)
    const query = `
      SELECT
        id, username, email, full_name, role,
        CASE WHEN is_active = 1 THEN 'active' ELSE 'inactive' END as status,
        last_login_at as last_login, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const users = await c.env.DB.prepare(query).bind(...params, limit, offset).all();

    return c.json({
      success: true,
      data: {
        data: users.results,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      },
      message: 'Lấy danh sách người dùng thành công'
    });
  } catch (error) {
    console.error('Get users simple error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy danh sách người dùng'
    }, 500);
  }
});

export default app;