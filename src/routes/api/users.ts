import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, requireRole } from '../../middleware/auth';
import bcrypt from 'bcryptjs';

const app = new Hono<{ Bindings: Env }>();

// Check if in production mode
function isProduction(env: Env): boolean {
  return env.NODE_ENV === 'production' || env.ENVIRONMENT === 'production';
}

// Hash password securely
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12; // High security for production
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Simple test endpoint
app.get('/', async (c: any) => {
  return c.json({
    success: true,
    data: [],
    message: 'Users endpoint working - simplified version'
  });
});

/*
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

// PRODUCTION-SECURED: Create admin endpoint with restrictions
app.get('/create-admin', async (c: any) => {
  try {
    // BLOCK IN PRODUCTION - Only allow in development
    if (isProduction(c.env)) {
      return c.json({
        success: false,
        error: 'Admin creation is disabled in production for security'
      }, 403);
    }

    // Check if secret is provided for additional security
    const secret = c.req.query('secret');
    if (!secret || secret !== 'smartpos-init-secret-2025') {
      return c.json({
        success: false,
        error: 'Invalid or missing init secret'
      }, 401);
    }

    // Hash password securely - NO MORE PLAIN TEXT
    const hashedPassword = await hashPassword('admin123'); // Stronger default password

    // Just insert admin user with hashed password
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO users (id, username, email, password_hash, password_salt, full_name, role, store_id, is_active)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      'admin',
      'admin@smartpos.vn',
      hashedPassword, // Properly hashed password
      '', // No longer use salt field - bcrypt handles salting
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
// PRODUCTION-SECURED: Init endpoint with restrictions
app.get('/init', async (c: any) => {
  try {
    // BLOCK IN PRODUCTION - Only allow in development
    if (isProduction(c.env)) {
      return c.json({
        success: false,
        error: 'Database initialization is disabled in production for security'
      }, 403);
    }

    // Require secret for additional security
    const secret = c.req.query('secret');
    if (!secret || secret !== 'smartpos-init-secret-2025') {
      return c.json({
        success: false,
        error: 'Invalid or missing init secret'
      }, 401);
    }

    await initUsersTable(c.env.DB);
    await createDefaultAdmin(c.env.DB);

    return c.json({
      success: true,
      message: 'Database initialized successfully (DEVELOPMENT ONLY)'
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
app.get('/debug', async (c: any) => {
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
app.post('/register', async (c: any) => {
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

    // Hash password securely before storing
    const hashedPassword = await hashPassword(safePassword);

    // Insert new user with hashed password
    const result = await c.env.DB.prepare(`
      INSERT INTO users (username, email, password_hash, password_salt, full_name, phone, role, store_id, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      safeUsername,
      safeEmail,
      hashedPassword, // Properly hashed password
      '', // No longer use salt field - bcrypt handles salting
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
      message: (error as any)?.message || 'Unknown error',
      stack: (error as any)?.stack || 'No stack trace',
      name: (error as any)?.name || 'Unknown error type'
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

      // Hash password securely before storing
      const hashedPassword = await hashPassword('admin123'); // Stronger default password

      // Create admin user with hashed password
      await db.prepare(`
        INSERT INTO users (username, email, password_hash, password_salt, full_name, role, store_id, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        'admin',
        'admin@smartpos.vn',
        hashedPassword, // Properly hashed password
        '', // No longer use salt field - bcrypt handles salting
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

app.post('/register-validated', validate(registerSchema), async (c: any) => {
  const data = await c.req.json();
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

app.post('/init-admin', validate(initAdminSchema), async (c: any) => {
  const data = await c.req.json();
  const db = c.env.DB;

  try {
    // Check if any users exist
    const existingUsers = await db.prepare('SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL').first();
    
    if (existingUsers && (existingUsers as any).count > 0) {
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

// PRODUCTION-SECURED: Direct register endpoint with restrictions
app.post('/direct-register', validate(directRegisterSchema), async (c: any) => {
  const data = await c.req.json();

  // BLOCK IN PRODUCTION - Only allow in development
  if (isProduction(c.env)) {
    return c.json({
      success: false,
      error: 'Direct registration is disabled in production for security'
    }, 403);
  }

  // Verify stronger secret key
  if (data.secretKey !== 'smartpos-direct-register-secret-2025') {
    return c.json({
      success: false,
      message: 'Invalid or missing secret key'
    }, 401);
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

    // Hash password securely using bcrypt
    const password_hash = await hashPassword(data.password);

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
      '', // No longer use salt field - bcrypt handles salting
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
app.get('/test', async (c: any) => {
  return c.json({
    success: true,
    message: 'Users endpoint is working',
    data: null
  });
});

// Simple endpoint for frontend users list
app.get('/simple', async (c: any) => {
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

// Protected routes below this point - Apply authentication to all protected routes
app.use('/list', authenticate);
app.use('/profile', authenticate);
app.use('/update/*', authenticate);
app.use('/delete/*', authenticate);
app.use('/create', authenticate);

// GET /api/users/list - List users (admin/manager only)
app.get('/list', requireRole('manager'), async (c: any) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  const search = c.req.query('search') || '';
  const offset = (page - 1) * limit;

  const user = c.get('user');
  const role = c.req.query('role') || '';
  const status = c.req.query('status') || '';

  try {
    // Build query with proper permissions
    let query = `SELECT id, username, email, full_name, phone, role, store_id, is_active, created_at FROM users WHERE 1=1`;
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
    const params = [];

    // Non-admin users can only see users from their store
    if (user?.role !== 'admin') {
      query += ` AND store_id = ?`;
      countQuery += ` AND store_id = ?`;
      params.push(user?.storeId || 1);
    }

    if (search) {
      query += ` AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)`;
      countQuery += ` AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (role) {
      query += ` AND role = ?`;
      countQuery += ` AND role = ?`;
      params.push(role);
    }

    if (status === 'active') {
      query += ` AND is_active = 1`;
      countQuery += ` AND is_active = 1`;
    } else if (status === 'inactive') {
      query += ` AND is_active = 0`;
      countQuery += ` AND is_active = 0`;
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;

    const [users, countResult] = await Promise.all([
      c.env.DB.prepare(query).bind(...params, limit, offset).all(),
      c.env.DB.prepare(countQuery).bind(...params).first()
    ]);

    const total = (countResult as any)?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return c.json({
      success: true,
      data: {
        data: users.results || [],
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      },
      message: 'Danh sách người dùng'
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({
      success: false,
      message: 'Đã xảy ra lỗi khi truy vấn danh sách người dùng'
    }, 500);
  }
});

// GET /api/users/profile - Get current user profile
app.get('/profile', async (c: any) => {
  try {
    const user = c.get('user');

    if (!user) {
      return c.json({
        success: false,
        message: 'User information not found in session',
        error: 'USER_NOT_FOUND'
      }, 404);
    }

    const userDetails = await c.env.DB.prepare(`
      SELECT id, username, email, full_name, phone, role, store_id, is_active, created_at, last_login_at
      FROM users WHERE id = ?
    `).bind(user.id).first();

    if (!userDetails) {
      return c.json({
        success: false,
        message: 'User not found in database',
        error: 'USER_NOT_FOUND'
      }, 404);
    }

    return c.json({
      success: true,
      data: userDetails,
      message: 'User profile retrieved successfully'
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return c.json({
      success: false,
      message: 'Failed to get user profile',
      error: 'PROFILE_ERROR'
    }, 500);
  }
});

// GET /api/users/:id - Get user details (admin/manager only, store-based access for managers)
app.get('/:id', requireRole('manager'), async (c: any) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user');

    // Build query with proper access control
    let query = `SELECT id, username, email, full_name, phone, role, store_id, is_active, created_at, updated_at FROM users WHERE id = ?`;
    const params = [id];

    // Non-admin users can only see users from their store
    if (currentUser?.role !== 'admin') {
      query += ` AND store_id = ?`;
      params.push(currentUser?.storeId || 1);
    }

    const userDetails = await c.env.DB.prepare(query).bind(...params).first();

    if (!userDetails) {
      return c.json({
        success: false,
        message: 'Không tìm thấy người dùng hoặc không có quyền truy cập',
        error: 'USER_NOT_FOUND'
      }, 404);
    }

    return c.json({
      success: true,
      data: userDetails,
      message: 'Thông tin người dùng'
    });
  } catch (error) {
    console.error('Get user details error:', error);
    return c.json({
      success: false,
      message: 'Đã xảy ra lỗi khi truy vấn thông tin người dùng',
      error: 'USER_DETAILS_ERROR'
    }, 500);
  }
});

// POST /api/users/create - Create new user (admin only)
app.post('/create', requireRole('admin'), async (c: any) => {
  try {
    const data = await c.req.json();
    const { username, email, password, full_name, phone, role, store_id } = data;

    if (!username || !email || !password || !full_name) {
      return c.json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: username, email, password, full_name',
        error: 'REQUIRED_FIELDS_MISSING'
      }, 400);
    }

    // Validate role
    const validRoles = ['admin', 'manager', 'cashier', 'inventory'];
    if (role && !validRoles.includes(role)) {
      return c.json({
        success: false,
        message: 'Vai trò không hợp lệ',
        error: 'INVALID_ROLE'
      }, 400);
    }

    // Check if user exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE username = ? OR email = ?'
    ).bind(username, email).first();

    if (existingUser) {
      return c.json({
        success: false,
        message: 'Tên đăng nhập hoặc email đã tồn tại',
        error: 'USER_EXISTS'
      }, 400);
    }

    // Create user with proper hashing (in production, this should be properly hashed)
    const result = await c.env.DB.prepare(`
      INSERT INTO users (username, email, password_hash, password_salt, full_name, phone, role, store_id, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      username,
      email,
      password, // In production, this should be hashed
      'smartpos_salt',
      full_name,
      phone || null,
      role || 'cashier',
      store_id || 1,
      1
    ).run();

    return c.json({
      success: true,
      data: {
        id: result.meta?.last_row_id,
        username,
        email,
        full_name,
        role: role || 'cashier'
      },
      message: 'Tạo người dùng thành công'
    }, 201);
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({
      success: false,
      message: 'Lỗi tạo người dùng: ' + (error instanceof Error ? error.message : String(error)),
      error: 'USER_CREATE_ERROR'
    }, 500);
  }
});

// PUT /api/users/update/:id - Update user (admin only, or manager for same store)
app.put('/update/:id', requireRole('manager'), async (c: any) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const currentUser = c.get('user');

    // Check permissions - admin can edit anyone, managers can only edit users in their store
    if (currentUser?.role !== 'admin') {
      const targetUser = await c.env.DB.prepare(
        'SELECT store_id FROM users WHERE id = ?'
      ).bind(id).first();

      if (!targetUser || (targetUser as any).store_id !== currentUser?.storeId) {
        return c.json({
          success: false,
          message: 'Không có quyền chỉnh sửa người dùng này',
          error: 'INSUFFICIENT_PERMISSIONS'
        }, 403);
      }
    }

    const { username, email, full_name, phone, role, store_id, is_active } = data;

    // Build update query
    let updateQuery = 'UPDATE users SET updated_at = datetime(\'now\')';
    const params = [];

    if (username) {
      updateQuery += ', username = ?';
      params.push(username);
    }
    if (email) {
      updateQuery += ', email = ?';
      params.push(email);
    }
    if (full_name) {
      updateQuery += ', full_name = ?';
      params.push(full_name);
    }
    if (phone !== undefined) {
      updateQuery += ', phone = ?';
      params.push(phone);
    }
    if (role && ['admin', 'manager', 'cashier', 'inventory'].includes(role)) {
      updateQuery += ', role = ?';
      params.push(role);
    }
    if (store_id && Number.isInteger(store_id)) {
      updateQuery += ', store_id = ?';
      params.push(store_id);
    }
    if (is_active !== undefined) {
      updateQuery += ', is_active = ?';
      params.push(is_active ? 1 : 0);
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    const result = await c.env.DB.prepare(updateQuery).bind(...params).run();

    if (!result.changes || result.changes === 0) {
      return c.json({
        success: false,
        message: 'Không tìm thấy người dùng để cập nhật',
        error: 'USER_NOT_FOUND'
      }, 404);
    }

    // Get updated user
    const updatedUser = await c.env.DB.prepare(`
      SELECT id, username, email, full_name, phone, role, store_id, is_active, updated_at
      FROM users WHERE id = ?
    `).bind(id).first();

    return c.json({
      success: true,
      data: updatedUser,
      message: 'Cập nhật người dùng thành công'
    });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({
      success: false,
      message: 'Lỗi cập nhật người dùng',
      error: 'USER_UPDATE_ERROR'
    }, 500);
  }
});

// DELETE /api/users/delete/:id - Delete/deactivate user (admin only)
app.delete('/delete/:id', requireRole('admin'), async (c: any) => {
  try {
    const id = c.req.param('id');

    if (id === '1') {
      return c.json({
        success: false,
        message: 'Không thể xóa tài khoản admin chính',
        error: 'CANNOT_DELETE_MAIN_ADMIN'
      }, 400);
    }

    // Deactivate instead of deleting
    const result = await c.env.DB.prepare(`
      UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = ?
    `).bind(id).run();

    if (!result.changes || result.changes === 0) {
      return c.json({
        success: false,
        message: 'Không tìm thấy người dùng để xóa',
        error: 'USER_NOT_FOUND'
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Đã vô hiệu hóa người dùng'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({
      success: false,
      message: 'Lỗi xóa người dùng',
      error: 'USER_DELETE_ERROR'
    }, 500);
  }
});

*/

export default app;
