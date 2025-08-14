/**
 * Employee Management Routes with Commission System
 */

import { Hono } from 'hono';
import { Env } from '../types';
import { requirePermission } from '../middleware/rbac';

const app = new Hono<{ Bindings: Env }>();

// Initialize employees and commissions tables
async function initializeEmployeeTables(env: Env) {
  try {
    // Check if employees table exists
    const tableInfo = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='employees'
    `).first();

    if (!tableInfo) {
      // Create new employees table with roles and commission
      await env.DB.prepare(`
        CREATE TABLE employees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          full_name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          role TEXT DEFAULT 'cashier' CHECK (role IN ('admin', 'cashier', 'sales_agent', 'affiliate')),
          commission_rate REAL DEFAULT 0.0,
          base_salary REAL DEFAULT 0,
          hire_date TEXT DEFAULT CURRENT_TIMESTAMP,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
          notes TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          deleted_at TEXT NULL
        )
      `).run();
      console.log('Created new employees table with commission system');

      // Add sample employees data
      const sampleEmployees = [
        {
          full_name: 'Nguyễn Văn Admin',
          phone: '0901234567',
          email: 'admin@smartpos.vn',
          role: 'admin',
          commission_rate: 0.0,
          base_salary: 15000000,
          status: 'active',
          notes: 'Quản trị viên hệ thống'
        },
        {
          full_name: 'Trần Thị Thu Ngân',
          phone: '0902345678',
          email: 'thunga@smartpos.vn',
          role: 'cashier',
          commission_rate: 0.02,
          base_salary: 8000000,
          status: 'active',
          notes: 'Thu ngân chính'
        },
        {
          full_name: 'Lê Văn Kinh Doanh',
          phone: '0903456789',
          email: 'sales@smartpos.vn',
          role: 'sales_agent',
          commission_rate: 0.05,
          base_salary: 10000000,
          status: 'active',
          notes: 'Nhân viên kinh doanh'
        },
        {
          full_name: 'Phạm Thị Cộng Tác',
          phone: '0904567890',
          email: 'affiliate@smartpos.vn',
          role: 'affiliate',
          commission_rate: 0.03,
          base_salary: 0,
          status: 'active',
          notes: 'Cộng tác viên bán hàng'
        }
      ];

      for (const employee of sampleEmployees) {
        await env.DB.prepare(`
          INSERT INTO employees (full_name, phone, email, role, commission_rate, base_salary, status, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          employee.full_name,
          employee.phone,
          employee.email,
          employee.role,
          employee.commission_rate,
          employee.base_salary,
          employee.status,
          employee.notes
        ).run();
      }
      console.log('Added sample employees data');
    } else {
      // Add new columns to existing table if they don't exist
      try {
        await env.DB.prepare(`ALTER TABLE employees ADD COLUMN role TEXT DEFAULT 'cashier'`).run();
        console.log('Added role column to employees table');
      } catch (error) {
        console.log('Role column already exists or error:', error);
      }

      try {
        await env.DB.prepare(`ALTER TABLE employees ADD COLUMN commission_rate REAL DEFAULT 0.0`).run();
        console.log('Added commission_rate column to employees table');
      } catch (error) {
        console.log('Commission_rate column already exists or error:', error);
      }

      try {
        await env.DB.prepare(`ALTER TABLE employees ADD COLUMN base_salary REAL DEFAULT 0`).run();
        console.log('Added base_salary column to employees table');
      } catch (error) {
        console.log('Base_salary column already exists or error:', error);
      }

      try {
        await env.DB.prepare(`ALTER TABLE employees ADD COLUMN notes TEXT`).run();
        console.log('Added notes column to employees table');
      } catch (error) {
        console.log('Notes column already exists or error:', error);
      }
    }

    // Create commissions table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS commissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        employee_id INTEGER NOT NULL,
        commission_rate REAL NOT NULL,
        commission_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
        paid_at TEXT NULL,
        notes TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales (id),
        FOREIGN KEY (employee_id) REFERENCES employees (id)
      )
    `).run();

    console.log('Employee and commission tables initialized successfully');
  } catch (error) {
    console.error('Error initializing employee tables:', error);
    throw error;
  }
}

// Initialize sample employees
async function createSampleEmployees(env: Env) {
  try {
    // Check if employees exist
    const count = await env.DB.prepare('SELECT COUNT(*) as count FROM employees').first<{ count: number }>();
    
    if (!count || count.count === 0) {
      console.log('Creating sample employees...');
      
      // Admin user
      await env.DB.prepare(`
        INSERT INTO employees (full_name, phone, email, role, commission_rate, base_salary, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'Admin User',
        '0123456789',
        'admin@smartpos.vn',
        'admin',
        0.0,
        15000000,
        'Quản trị viên hệ thống'
      ).run();

      // Thu ngân
      await env.DB.prepare(`
        INSERT INTO employees (full_name, phone, email, role, commission_rate, base_salary, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'Nguyễn Thị Thu',
        '0987654321',
        'thu@smartpos.vn',
        'cashier',
        1.0,
        8000000,
        'Thu ngân chính'
      ).run();

      // Nhân viên kinh doanh
      await env.DB.prepare(`
        INSERT INTO employees (full_name, phone, email, role, commission_rate, base_salary, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'Trần Văn Nam',
        '0912345678',
        'nam@smartpos.vn',
        'sales_agent',
        3.0,
        6000000,
        'Nhân viên kinh doanh senior'
      ).run();

      // Cộng tác viên
      await env.DB.prepare(`
        INSERT INTO employees (full_name, phone, email, role, commission_rate, base_salary, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        'Lê Thị Hoa',
        '0934567890',
        'hoa@smartpos.vn',
        'affiliate',
        5.0,
        0,
        'Cộng tác viên bán hàng'
      ).run();

      console.log('Sample employees created successfully');
    }
  } catch (error) {
    console.error('Error creating sample employees:', error);
    throw error;
  }
}

// Public endpoint to initialize tables
app.get('/init-tables', async (c) => {
  try {
    await initializeEmployeeTables(c.env);
    await createSampleEmployees(c.env);

    return c.json({
      success: true,
      data: null,
      message: 'Employee tables initialized'
    });
  } catch (error) {
    console.error('Init employee tables error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Init error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Simple test endpoint
app.get('/test-simple', async (c) => {
  try {
    // Simple count query
    const count = await c.env.DB.prepare('SELECT COUNT(*) as total FROM employees').first<{ total: number }>();

    return c.json({
      success: true,
      data: {
        count: count?.total || 0,
        message: 'Employees table accessible'
      }
    });
  } catch (error) {
    console.error('Test simple error:', error);
    return c.json({
      success: false,
      message: 'Test error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Simple employees list endpoint
app.get('/simple', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;

    // Get total count (return 0 if table doesn't exist)
    let total = 0;
    try {
      const countResult = await c.env.DB.prepare('SELECT COUNT(*) as total FROM employees').first<{ total: number }>();
      total = countResult?.total || 0;
    } catch (error) {
      console.log('Employees table may not exist:', error);
    }

    // Get employees (return empty if table doesn't exist)
    let employees: any[] = [];
    try {
      const result = await c.env.DB.prepare(`
        SELECT id, full_name, phone, email, role, status, created_at
        FROM employees
        WHERE status != 'deleted'
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all();
      employees = result.results || [];
    } catch (error) {
      console.log('Error querying employees:', error);
    }

    const totalPages = Math.ceil(total / limit);

    return c.json({
      success: true,
      message: 'Danh sách nhân viên',
      data: {
        data: employees,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      }
    });
  } catch (error) {
    console.error('Error in employees simple endpoint:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy danh sách nhân viên',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /employees - List all employees with proper pagination
app.get('/', requirePermission('administration.employees.access'), async (c) => {
  try {
    await initializeEmployeeTables(c.env);

    // Get pagination parameters
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;

    // Get filters
    const search = c.req.query('search') || '';
    const role = c.req.query('role') || '';
    const status = c.req.query('status') || '';

    // Build WHERE clause
    let whereClause = 'WHERE status != \'deleted\'';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM employees ${whereClause}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = Number(countResult?.total || 0);

    // Get employees with pagination
    const employeesQuery = `
      SELECT id, full_name, phone, email, role, commission_rate, base_salary, status, created_at
      FROM employees
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    const employees = await c.env.DB.prepare(employeesQuery)
      .bind(...params, limit, offset)
      .all();

    const totalPages = Math.ceil(total / limit);

    return c.json({
      success: true,
      data: {
        data: employees.results || [],
        pagination: {
          total: total,
          page: page,
          limit: limit,
          totalPages: totalPages
        }
      },
      message: 'Lấy danh sách nhân viên thành công'
    });
  } catch (error) {
    console.error('Get employees error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy danh sách nhân viên: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Debug endpoint to check employees table schema
app.get('/schema-debug', async (c) => {
  try {
    const employeesSchema = await c.env.DB.prepare("PRAGMA table_info(employees)").all();
    const commissionsSchema = await c.env.DB.prepare("PRAGMA table_info(commissions)").all();

    return c.json({
      success: true,
      data: {
        employeesSchema: employeesSchema.results,
        commissionsSchema: commissionsSchema.results
      },
      message: 'Employee schema retrieved successfully'
    });
  } catch (error) {
    console.error('Debug employee schema error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Error retrieving employee schema: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// GET /employees/active - Get active employees for selection
app.get('/active', async (c) => {
  try {
    await initializeEmployeeTables(c.env);

    const role = c.req.query('role') || '';

    let whereClause = 'WHERE status = ?';
    const params: any[] = ['active'];

    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    const query = `
      SELECT
        id, full_name, role, commission_rate
      FROM employees
      ${whereClause}
      ORDER BY full_name ASC
    `;

    const employees = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: employees.results,
      message: 'Lấy danh sách nhân viên hoạt động thành công'
    });
  } catch (error) {
    console.error('Get active employees error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy danh sách nhân viên hoạt động'
    }, 500);
  }
});

// POST /employees - Create new employee
app.post('/', requirePermission('administration.employees.create'), async (c) => {
  try {
    await initializeEmployeeTables(c.env);

    const data = await c.req.json();
    const { full_name, phone, email, role, commission_rate, base_salary, notes } = data;

    // Validation
    if (!full_name || !role) {
      return c.json({
        success: false,
        data: null,
        message: 'Tên và vai trò là bắt buộc'
      }, 400);
    }

    if (!['admin', 'cashier', 'sales_agent', 'affiliate'].includes(role)) {
      return c.json({
        success: false,
        data: null,
        message: 'Vai trò không hợp lệ'
      }, 400);
    }

    // Check if email exists
    if (email) {
      const existingEmployee = await c.env.DB.prepare(
        'SELECT id FROM employees WHERE email = ? AND status != \'deleted\''
      ).bind(email).first();

      if (existingEmployee) {
        return c.json({
          success: false,
          data: null,
          message: 'Email đã tồn tại'
        }, 400);
      }
    }

    // Generate employee code
    const timestamp = Date.now().toString().slice(-6);
    const employee_code = `EMP${timestamp}`;

    // Insert employee
    const result = await c.env.DB.prepare(`
      INSERT INTO employees (employee_code, full_name, phone, email, role, commission_rate, base_salary, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      employee_code,
      full_name,
      phone || null,
      email || null,
      role,
      commission_rate || 0.0,
      base_salary || 0,
      notes || null
    ).run();

    return c.json({
      success: true,
      data: { id: result.meta.last_row_id },
      message: 'Tạo nhân viên thành công'
    });
  } catch (error) {
    console.error('Create employee error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi tạo nhân viên'
    }, 500);
  }
});

// GET /employees/:id - Get employee details
app.get('/:id', async (c) => {
  try {
    const employeeId = parseInt(c.req.param('id'));

    if (isNaN(employeeId)) {
      return c.json({
        success: false,
        data: null,
        message: 'ID nhân viên không hợp lệ'
      }, 400);
    }

    const employee = await c.env.DB.prepare(`
      SELECT
        id, full_name, phone, email, role, commission_rate, base_salary,
        hire_date, status, notes, created_at, updated_at
      FROM employees
      WHERE id = ? AND status != 'deleted'
    `).bind(employeeId).first();

    if (!employee) {
      return c.json({
        success: false,
        data: null,
        message: 'Không tìm thấy nhân viên'
      }, 404);
    }

    return c.json({
      success: true,
      data: employee,
      message: 'Lấy thông tin nhân viên thành công'
    });
  } catch (error) {
    console.error('Get employee error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi lấy thông tin nhân viên'
    }, 500);
  }
});

// PUT /employees/:id - Update employee
app.put('/:id', requirePermission('administration.employees.update'), async (c) => {
  try {
    const employeeId = parseInt(c.req.param('id'));
    const data = await c.req.json();

    if (isNaN(employeeId)) {
      return c.json({
        success: false,
        data: null,
        message: 'ID nhân viên không hợp lệ'
      }, 400);
    }

    const { full_name, phone, email, role, commission_rate, base_salary, status, notes } = data;

    // Check if employee exists
    const existingEmployee = await c.env.DB.prepare(
      'SELECT id FROM employees WHERE id = ? AND status != \'deleted\''
    ).bind(employeeId).first();

    if (!existingEmployee) {
      return c.json({
        success: false,
        data: null,
        message: 'Không tìm thấy nhân viên'
      }, 404);
    }

    // Check email uniqueness if changed
    if (email) {
      const emailExists = await c.env.DB.prepare(
        'SELECT id FROM employees WHERE email = ? AND id != ? AND status != \'deleted\''
      ).bind(email, employeeId).first();

      if (emailExists) {
        return c.json({
          success: false,
          data: null,
          message: 'Email đã tồn tại'
        }, 400);
      }
    }

    // Update employee
    await c.env.DB.prepare(`
      UPDATE employees
      SET full_name = ?, phone = ?, email = ?, role = ?, commission_rate = ?,
          base_salary = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      full_name,
      phone || null,
      email || null,
      role,
      commission_rate || 0.0,
      base_salary || 0,
      status || 'active',
      notes || null,
      employeeId
    ).run();

    return c.json({
      success: true,
      data: null,
      message: 'Cập nhật nhân viên thành công'
    });
  } catch (error) {
    console.error('Update employee error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi cập nhật nhân viên'
    }, 500);
  }
});

// DELETE /employees/:id - Soft delete employee
app.delete('/:id', requirePermission('administration.employees.delete'), async (c) => {
  try {
    const employeeId = parseInt(c.req.param('id'));

    if (isNaN(employeeId)) {
      return c.json({
        success: false,
        data: null,
        message: 'ID nhân viên không hợp lệ'
      }, 400);
    }

    // Check if employee exists
    const existingEmployee = await c.env.DB.prepare(
      'SELECT id FROM employees WHERE id = ? AND status != \'deleted\''
    ).bind(employeeId).first();

    if (!existingEmployee) {
      return c.json({
        success: false,
        data: null,
        message: 'Không tìm thấy nhân viên'
      }, 404);
    }

    // Soft delete by changing status
    await c.env.DB.prepare(`
      UPDATE employees
      SET status = 'deleted', updated_at = datetime('now')
      WHERE id = ?
    `).bind(employeeId).run();

    return c.json({
      success: true,
      data: null,
      message: 'Xóa nhân viên thành công'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Lỗi khi xóa nhân viên'
    }, 500);
  }
});

export default app;
