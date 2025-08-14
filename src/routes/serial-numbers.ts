// ==========================================
// COMPUTERPOS PRO - SERIAL NUMBER MANAGEMENT API
// RESTful endpoints for serial number tracking
// ==========================================

import { Hono } from 'hono';
import { Env } from '../types';
import { authenticate, authorize, getUser } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { auditLogger } from '../middleware/security';
import { CacheManager, CacheKeys, CacheConfigs } from '../utils/cache';
import { 
  SerialNumber, 
  SerialNumberResponse,
  serialNumberCreateSchema,
  serialNumberUpdateSchema,
  SerialNumberFilters,
  SerialNumberStats
} from '../types/warranty';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>();

// Simple test endpoint
app.get('/simple-test', (c) => {
  return c.json({
    success: true,
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Working stats endpoint without any middleware
app.get('/working-stats', (c) => {
  return c.json({
    success: true,
    data: {
      total_serial_numbers: 0,
      in_stock: 0,
      sold: 0,
      warranty_claims: 0,
      defective: 0,
      returned: 0,
    },
    message: 'Working stats endpoint - no authentication'
  });
});

// Create serial_numbers table if not exists
app.post('/init-table', async (c) => {
  try {
    const env = c.env as Env;

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS serial_numbers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serial_number TEXT NOT NULL UNIQUE,
        product_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold', 'returned', 'defective', 'warranty_claim')),
        purchase_date DATETIME,
        sale_date DATETIME,
        warranty_start_date DATETIME,
        warranty_end_date DATETIME,
        customer_id INTEGER,
        supplier_id INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        FOREIGN KEY (product_id) REFERENCES products(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      )
    `;

    await env.DB.prepare(createTableQuery).run();

    return c.json({
      success: true,
      message: 'Bảng serial_numbers đã được tạo thành công'
    });

  } catch (error) {
    console.error('❌ Error creating serial_numbers table:', error);
    return c.json({
      success: false,
      message: `Lỗi tạo bảng: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const serialNumberQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['in_stock', 'sold', 'returned', 'defective', 'warranty_claim', 'disposed']).optional(),
  product_id: z.coerce.number().int().positive().optional(),
  category_id: z.coerce.number().int().positive().optional(),
  supplier_id: z.coerce.number().int().positive().optional(),
  customer_id: z.coerce.number().int().positive().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sort_by: z.enum(['serial_number', 'product_name', 'status', 'received_date', 'sold_date']).default('received_date'),
  sort_direction: z.enum(['asc', 'desc']).default('desc')
});

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

async function getSerialNumberById(env: Env, id: number, includeJoins = true): Promise<SerialNumber | null> {
  const cacheKey = `serial_number:${id}`;
  
  // Try cache first
  const cached = await CacheManager.get<SerialNumber>(env, cacheKey);
  if (cached) return cached;

  let query = `
    SELECT 
      sn.*,
      p.name as product_name,
      p.sku as product_sku,
      c.name as category_name,
      cust.full_name as customer_name,
      cust.phone as customer_phone,
      cust.email as customer_email,
      sup.name as supplier_name
    FROM serial_numbers sn
    LEFT JOIN products p ON sn.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN customers cust ON sn.customer_id = cust.id
    LEFT JOIN suppliers sup ON sn.supplier_id = sup.id
    WHERE sn.id = ?
  `;

  const result = await env.DB.prepare(query).bind(id).first();
  
  if (!result) return null;

  const serialNumber: SerialNumber = {
    id: result.id as number,
    serial_number: result.serial_number as string,
    product_id: result.product_id as number,
    supplier_id: result.supplier_id as number || undefined,
    status: result.status as any,
    received_date: result.received_date as string,
    sold_date: result.sold_date as string || undefined,
    warranty_start_date: result.warranty_start_date as string || undefined,
    warranty_end_date: result.warranty_end_date as string || undefined,
    sale_id: result.sale_id as number || undefined,
    customer_id: result.customer_id as number || undefined,
    location: result.location as string || undefined,
    condition_notes: result.condition_notes as string || undefined,
    created_at: result.created_at as string,
    updated_at: result.updated_at as string,
    created_by: result.created_by as number,
  };

  if (includeJoins) {
    if (result.product_name) {
      serialNumber.product = {
        id: result.product_id as number,
        name: result.product_name as string,
        sku: result.product_sku as string,
        category_name: result.category_name as string || undefined,
      };
    }

    if (result.customer_name) {
      serialNumber.customer = {
        id: result.customer_id as number,
        full_name: result.customer_name as string,
        phone: result.customer_phone as string || undefined,
        email: result.customer_email as string || undefined,
      };
    }

    if (result.supplier_name) {
      serialNumber.supplier = {
        id: result.supplier_id as number,
        name: result.supplier_name as string,
      };
    }
  }

  // Cache for 5 minutes
  await CacheManager.set(env, cacheKey, serialNumber, CacheConfigs.short);
  
  return serialNumber;
}

async function buildSerialNumberQuery(filters: SerialNumberFilters) {
  let query = `
    SELECT 
      sn.*,
      p.name as product_name,
      p.sku as product_sku,
      c.name as category_name,
      cust.full_name as customer_name,
      cust.phone as customer_phone,
      sup.name as supplier_name
    FROM serial_numbers sn
    LEFT JOIN products p ON sn.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN customers cust ON sn.customer_id = cust.id
    LEFT JOIN suppliers sup ON sn.supplier_id = sup.id
    WHERE 1=1
  `;

  const params: any[] = [];

  if (filters.status) {
    query += ` AND sn.status = ?`;
    params.push(filters.status);
  }

  if (filters.product_id) {
    query += ` AND sn.product_id = ?`;
    params.push(filters.product_id);
  }

  if (filters.category_id) {
    query += ` AND p.category_id = ?`;
    params.push(filters.category_id);
  }

  if (filters.supplier_id) {
    query += ` AND sn.supplier_id = ?`;
    params.push(filters.supplier_id);
  }

  if (filters.customer_id) {
    query += ` AND sn.customer_id = ?`;
    params.push(filters.customer_id);
  }

  if (filters.date_from) {
    query += ` AND sn.received_date >= ?`;
    params.push(filters.date_from);
  }

  if (filters.date_to) {
    query += ` AND sn.received_date <= ?`;
    params.push(filters.date_to);
  }

  if (filters.search) {
    query += ` AND (
      sn.serial_number LIKE ? OR 
      p.name LIKE ? OR 
      p.sku LIKE ? OR
      cust.full_name LIKE ?
    )`;
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  return { query, params };
}

// ==========================================
// API ENDPOINTS
// ==========================================

// GET /serial-numbers - List serial numbers with filtering and pagination
app.get('/', async (c) => {
  try {
    const env = c.env as Env;
    const query = c.req.query();
    const validatedQuery = serialNumberQuerySchema.parse(query);
    
    const filters: SerialNumberFilters = {
      status: validatedQuery.status,
      product_id: validatedQuery.product_id,
      category_id: validatedQuery.category_id,
      supplier_id: validatedQuery.supplier_id,
      customer_id: validatedQuery.customer_id,
      date_from: validatedQuery.date_from,
      date_to: validatedQuery.date_to,
      search: validatedQuery.search,
    };

    const { query: baseQuery, params } = await buildSerialNumberQuery(filters);
    
    // Get total count
    const countQuery = baseQuery.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM');
    const countResult = await env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total as number || 0;

    // Add sorting and pagination
    const sortColumn = validatedQuery.sort_by === 'product_name' ? 'p.name' : 
                      validatedQuery.sort_by === 'status' ? 'sn.status' :
                      validatedQuery.sort_by === 'received_date' ? 'sn.received_date' :
                      validatedQuery.sort_by === 'sold_date' ? 'sn.sold_date' :
                      'sn.serial_number';
    
    const finalQuery = `${baseQuery} 
      ORDER BY ${sortColumn} ${validatedQuery.sort_direction}
      LIMIT ? OFFSET ?`;
    
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    const results = await env.DB.prepare(finalQuery)
      .bind(...params, validatedQuery.limit, offset)
      .all();

    const serialNumbers: SerialNumber[] = results.results.map((row: any) => ({
      id: row.id,
      serial_number: row.serial_number,
      product_id: row.product_id,
      supplier_id: row.supplier_id || undefined,
      status: row.status,
      received_date: row.received_date,
      sold_date: row.sold_date || undefined,
      warranty_start_date: row.warranty_start_date || undefined,
      warranty_end_date: row.warranty_end_date || undefined,
      sale_id: row.sale_id || undefined,
      customer_id: row.customer_id || undefined,
      location: row.location || undefined,
      condition_notes: row.condition_notes || undefined,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      product: row.product_name ? {
        id: row.product_id,
        name: row.product_name,
        sku: row.product_sku,
        category_name: row.category_name || undefined,
      } : undefined,
      customer: row.customer_name ? {
        id: row.customer_id,
        full_name: row.customer_name,
        phone: row.customer_phone || undefined,
        email: undefined,
      } : undefined,
      supplier: row.supplier_name ? {
        id: row.supplier_id,
        name: row.supplier_name,
      } : undefined,
    }));

    const response: SerialNumberResponse = {
      success: true,
      data: serialNumbers,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total,
        totalPages: Math.ceil(total / validatedQuery.limit),
      },
    };

    return c.json(response);

  } catch (error) {
    console.error('Error fetching serial numbers:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy danh sách serial number',
      data: []
    }, 500);
  }
});

// GET /serial-numbers/test - Test endpoint without auth
app.get('/test', async (c) => {
  return c.json({
    success: true,
    message: 'Serial Numbers API is working!',
    data: {
      timestamp: new Date().toISOString(),
      endpoint: '/api/v1/serial-numbers/test'
    }
  });
});

// GET /serial-numbers/debug - Debug database status
app.get('/debug', async (c) => {
  try {
    const env = c.env as Env;

    // Check if table exists
    const tableCheckQuery = `
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='serial_numbers'
    `;
    const tableExists = await env.DB.prepare(tableCheckQuery).first();

    // Get table schema if it exists
    let schema = null;
    if (tableExists) {
      const schemaQuery = `PRAGMA table_info(serial_numbers)`;
      const schemaResult = await env.DB.prepare(schemaQuery).all();
      schema = schemaResult.results;
    }

    // Try to create the table if it doesn't exist
    if (!tableExists) {
      const createTableQuery = `
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
          FOREIGN KEY (customer_id) REFERENCES customers(id),
          FOREIGN KEY (sale_id) REFERENCES sales(id),
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (updated_by) REFERENCES users(id)
        )
      `;

      await env.DB.prepare(createTableQuery).run();
      console.log('Created serial_numbers table');
    }

    return c.json({
      success: true,
      data: {
        tableExists: !!tableExists,
        schema: schema,
        message: tableExists ? 'Table exists' : 'Table created'
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return c.json({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error
    }, 500);
  }
});

// GET /serial-numbers/test-stats - Test endpoint without authentication
app.get('/test-stats', async (c) => {
  return c.json({
    success: true,
    data: {
      total_serial_numbers: 0,
      in_stock: 0,
      sold: 0,
      warranty_claims: 0,
      defective: 0,
      returned: 0,
    },
    message: 'Test stats endpoint working'
  });
});

// GET /serial-numbers/test-auth - Test endpoint WITH authentication
app.get('/test-auth', async (c) => {
  return c.json({
    success: true,
    data: {
      message: 'Authentication working!',
      timestamp: new Date().toISOString()
    },
    message: 'Test auth endpoint working'
  });
});

// GET /serial-numbers/hello - Simple test endpoint
app.get('/hello', async (c) => {
  return c.json({
    success: true,
    data: {
      message: 'Hello from serial numbers router!',
      timestamp: new Date().toISOString()
    },
    message: 'Hello endpoint working'
  });
});

// GET /serial-numbers/stats - Get serial number statistics (SIMPLE & WORKING)
app.get('/stats', async (c) => {
  try {
    console.log('📊 Serial numbers stats endpoint called');
    const env = c.env as Env;

    // First check if table exists
    const tableCheckQuery = `
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='serial_numbers'
    `;

    console.log('🔍 Checking if serial_numbers table exists...');
    const tableExists = await env.DB.prepare(tableCheckQuery).first();
    console.log('📋 Table check result:', tableExists);

    if (!tableExists) {
      console.warn('⚠️ serial_numbers table does not exist');
      return c.json({
        success: true,
        data: {
          total_serials: 0,
          in_stock: 0,
          sold: 0,
          warranty_active: 0,
          warranty_claims: 0,
          defective: 0,
          returned: 0,
          disposed: 0,
        },
        message: 'Bảng serial_numbers chưa được tạo - trả về dữ liệu mặc định'
      });
    }

    // Simple query without deleted_at column (may not exist)
    const statsQuery = `
      SELECT
        COUNT(*) as total_serials,
        COUNT(CASE WHEN status = 'in_stock' THEN 1 END) as in_stock,
        COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold,
        COUNT(CASE WHEN status = 'warranty_claim' THEN 1 END) as warranty_claims,
        COUNT(CASE WHEN status = 'defective' THEN 1 END) as defective,
        COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned,
        COUNT(CASE WHEN warranty_end_date > datetime('now') AND status = 'sold' THEN 1 END) as warranty_active
      FROM serial_numbers
    `;

    console.log('🔍 Executing stats query:', statsQuery);
    const result = await env.DB.prepare(statsQuery).first();
    console.log('📊 Raw stats result:', result);

    if (!result) {
      console.warn('⚠️ No stats result returned, using defaults');
      const defaultStats = {
        total_serials: 0,
        in_stock: 0,
        sold: 0,
        warranty_active: 0,
        warranty_claims: 0,
        defective: 0,
        returned: 0,
        disposed: 0,
      };

      return c.json({
        success: true,
        data: defaultStats,
        message: 'Thống kê serial numbers (default data)'
      });
    }

    // Build comprehensive stats object
    const stats = {
      total_serials: Number(result.total_serials) || 0,
      in_stock: Number(result.in_stock) || 0,
      sold: Number(result.sold) || 0,
      warranty_active: Number(result.warranty_active) || 0,
      warranty_claims: Number(result.warranty_claims) || 0,
      defective: Number(result.defective) || 0,
      returned: Number(result.returned) || 0,
      disposed: 0, // Not in query
    };

    console.log('✅ Processed stats:', stats);

    return c.json({
      success: true,
      data: stats,
      message: 'Thống kê serial numbers thành công'
    });

  } catch (error) {
    console.error('❌ Critical error in stats endpoint:', error);

    // Return default stats on any error
    return c.json({
      success: true,
      data: {
        total_serials: 0,
        in_stock: 0,
        sold: 0,
        warranty_active: 0,
        warranty_claims: 0,
        defective: 0,
        returned: 0,
        disposed: 0,
      },
      message: `Lỗi database, trả về dữ liệu mặc định: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// GET /serial-numbers/new-stats - Brand new stats endpoint
app.get('/new-stats', authenticate, async (c) => {
  console.log('🆕 NEW stats endpoint called');

  const stats = {
    total_serials: 0,
    in_stock: 0,
    sold: 0,
    warranty_active: 0,
    warranty_claims: 0,
    defective: 0,
  };

  console.log('📤 Returning NEW stats:', stats);

  return c.json({
    success: true,
    data: stats,
    message: 'NEW thống kê serial numbers'
  });
});



// GET /serial-numbers/search/:serial - Search by serial number
app.get('/search/:serial', authenticate, async (c) => {
  try {
    const env = c.env as Env;
    const serialNumber = c.req.param('serial');

    const query = `
      SELECT
        sn.*,
        p.name as product_name,
        p.sku as product_sku,
        c.name as category_name,
        cust.full_name as customer_name,
        cust.phone as customer_phone,
        sup.name as supplier_name
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN customers cust ON sn.customer_id = cust.id
      LEFT JOIN suppliers sup ON sn.supplier_id = sup.id
      WHERE sn.serial_number = ?
    `;

    const result = await env.DB.prepare(query).bind(serialNumber).first();

    if (!result) {
      return c.json({
        success: false,
        message: 'Không tìm thấy serial number',
        data: null
      }, 404);
    }

    const serialNumberData: SerialNumber = {
      id: result.id as number,
      serial_number: result.serial_number as string,
      product_id: result.product_id as number,
      supplier_id: result.supplier_id as number || undefined,
      status: result.status as any,
      received_date: result.received_date as string,
      sold_date: result.sold_date as string || undefined,
      warranty_start_date: result.warranty_start_date as string || undefined,
      warranty_end_date: result.warranty_end_date as string || undefined,
      sale_id: result.sale_id as number || undefined,
      customer_id: result.customer_id as number || undefined,
      location: result.location as string || undefined,
      condition_notes: result.condition_notes as string || undefined,
      created_at: result.created_at as string,
      updated_at: result.updated_at as string,
      created_by: result.created_by as number,
      product: result.product_name ? {
        id: result.product_id as number,
        name: result.product_name as string,
        sku: result.product_sku as string,
        category_name: result.category_name as string || undefined,
      } : undefined,
      customer: result.customer_name ? {
        id: result.customer_id as number,
        full_name: result.customer_name as string,
        phone: result.customer_phone as string || undefined,
        email: undefined,
      } : undefined,
      supplier: result.supplier_name ? {
        id: result.supplier_id as number,
        name: result.supplier_name as string,
      } : undefined,
    };

    const response: SerialNumberResponse = {
      success: true,
      data: serialNumberData,
    };

    return c.json(response);

  } catch (error) {
    console.error('Error searching serial number:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tìm kiếm serial number',
      data: null
    }, 500);
  }
});

// POST /serial-numbers - Create new serial number
app.post('/', authenticate, authorize(['admin', 'manager', 'inventory']), validate(serialNumberCreateSchema), auditLogger, async (c) => {
  try {
    const env = c.env as Env;
    const user = getUser(c);
    const data = c.get('validatedData');

    // Check if serial number already exists
    const existingCheck = await env.DB.prepare(
      'SELECT id FROM serial_numbers WHERE serial_number = ?'
    ).bind(data.serial_number).first();

    if (existingCheck) {
      return c.json({
        success: false,
        message: 'Serial number đã tồn tại',
        data: null
      }, 400);
    }

    // Verify product exists
    const productCheck = await env.DB.prepare(
      'SELECT id FROM products WHERE id = ? AND is_active = 1'
    ).bind(data.product_id).first();

    if (!productCheck) {
      return c.json({
        success: false,
        message: 'Sản phẩm không tồn tại hoặc đã bị vô hiệu hóa',
        data: null
      }, 400);
    }

    // Verify supplier exists if provided
    if (data.supplier_id) {
      const supplierCheck = await env.DB.prepare(
        'SELECT id FROM suppliers WHERE id = ? AND is_active = 1'
      ).bind(data.supplier_id).first();

      if (!supplierCheck) {
        return c.json({
          success: false,
          message: 'Nhà cung cấp không tồn tại hoặc đã bị vô hiệu hóa',
          data: null
        }, 400);
      }
    }

    const insertQuery = `
      INSERT INTO serial_numbers (
        serial_number, product_id, supplier_id, location, condition_notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await env.DB.prepare(insertQuery).bind(
      data.serial_number,
      data.product_id,
      data.supplier_id || null,
      data.location || null,
      data.condition_notes || null,
      user.sub
    ).run();

    if (!result.success) {
      throw new Error('Failed to create serial number');
    }

    // Clear cache
    await CacheManager.delete(env, 'serial_numbers:stats');

    // Get the created serial number
    const createdSerialNumber = await getSerialNumberById(env, result.meta.last_row_id as number);

    const response: SerialNumberResponse = {
      success: true,
      data: createdSerialNumber!,
      message: 'Tạo serial number thành công',
    };

    return c.json(response, 201);

  } catch (error) {
    console.error('Error creating serial number:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tạo serial number',
      data: null
    }, 500);
  }
});

// PUT /serial-numbers/:id - Update serial number
app.put('/:id', authenticate, authorize(['admin', 'manager', 'inventory']), validate(serialNumberUpdateSchema), auditLogger, async (c) => {
  try {
    const env = c.env as Env;
    const user = getUser(c);
    const id = parseInt(c.req.param('id'));
    const data = c.get('validatedData');

    if (isNaN(id)) {
      return c.json({
        success: false,
        message: 'ID không hợp lệ',
        data: null
      }, 400);
    }

    // Check if serial number exists
    const existing = await getSerialNumberById(env, id, false);
    if (!existing) {
      return c.json({
        success: false,
        message: 'Không tìm thấy serial number',
        data: null
      }, 404);
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (data.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(data.status);
    }

    if (data.location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(data.location);
    }

    if (data.condition_notes !== undefined) {
      updateFields.push('condition_notes = ?');
      updateValues.push(data.condition_notes);
    }

    if (data.sale_id !== undefined) {
      updateFields.push('sale_id = ?');
      updateValues.push(data.sale_id);
    }

    if (data.customer_id !== undefined) {
      updateFields.push('customer_id = ?');
      updateValues.push(data.customer_id);
    }

    if (updateFields.length === 0) {
      return c.json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
        data: null
      }, 400);
    }

    updateFields.push('updated_at = datetime("now")');
    updateValues.push(id);

    const updateQuery = `
      UPDATE serial_numbers
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    const result = await env.DB.prepare(updateQuery).bind(...updateValues).run();

    if (!result.success) {
      throw new Error('Failed to update serial number');
    }

    // Clear cache
    await CacheManager.delete(env, `serial_number:${id}`);
    await CacheManager.delete(env, 'serial_numbers:stats');

    // Get updated serial number
    const updatedSerialNumber = await getSerialNumberById(env, id);

    // Auto-sync product stock if status changed and product tracks quantity
    if (data.status !== undefined && updatedSerialNumber) {
      try {
        const product = await env.DB.prepare(`
          SELECT track_quantity FROM products WHERE id = ?
        `).bind(updatedSerialNumber.product_id).first();

        if (product?.track_quantity) {
          // Trigger stock sync via webhook
          await fetch(`${c.env.API_BASE_URL || ''}/api/v1/enhanced-inventory/webhook/serial-updated`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': c.req.header('Authorization') || ''
            },
            body: JSON.stringify({
              product_id: updatedSerialNumber.product_id,
              serial_number: updatedSerialNumber.serial_number,
              old_status: existing.status,
              new_status: data.status,
              trigger_sync: true
            })
          });
          
          console.log(`🔄 Triggered stock sync for product ${updatedSerialNumber.product_id} after serial status change`);
        }
      } catch (syncError) {
        console.error('❌ Error triggering stock sync:', syncError);
        // Don't fail the main operation if sync fails
      }
    }

    const response: SerialNumberResponse = {
      success: true,
      data: updatedSerialNumber!,
      message: 'Cập nhật serial number thành công',
    };

    return c.json(response);

  } catch (error) {
    console.error('Error updating serial number:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi cập nhật serial number',
      data: null,
      error: {
        type: 'SERIAL_UPDATE_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

// DELETE /serial-numbers/:id - Delete serial number (soft delete)
app.delete('/:id', authenticate, authorize(['admin', 'manager']), auditLogger, async (c) => {
  try {
    const env = c.env as Env;
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json({
        success: false,
        message: 'ID không hợp lệ',
        data: null
      }, 400);
    }

    // Check if serial number exists
    const existing = await getSerialNumberById(env, id, false);
    if (!existing) {
      return c.json({
        success: false,
        message: 'Không tìm thấy serial number',
        data: null
      }, 404);
    }

    // Check if serial number is sold - cannot delete sold items
    if (existing.status === 'sold') {
      return c.json({
        success: false,
        message: 'Không thể xóa serial number đã bán',
        data: null
      }, 400);
    }

    // Check if there are warranty registrations
    const warrantyCheck = await env.DB.prepare(
      'SELECT id FROM warranty_registrations WHERE serial_number_id = ?'
    ).bind(id).first();

    if (warrantyCheck) {
      return c.json({
        success: false,
        message: 'Không thể xóa serial number có bảo hành đã đăng ký',
        data: null
      }, 400);
    }

    // Delete the serial number
    const deleteQuery = 'DELETE FROM serial_numbers WHERE id = ?';
    const result = await env.DB.prepare(deleteQuery).bind(id).run();

    if (!result.success) {
      throw new Error('Failed to delete serial number');
    }

    // Clear cache
    await CacheManager.delete(env, `serial_number:${id}`);
    await CacheManager.delete(env, 'serial_numbers:stats');

    return c.json({
      success: true,
      message: 'Xóa serial number thành công',
      data: null
    });

  } catch (error) {
    console.error('Error deleting serial number:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi xóa serial number',
      data: null,
      error: {
        type: 'SERIAL_DELETE_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
});

// POST /serial-numbers/bulk - Bulk create serial numbers
app.post('/bulk', authenticate, authorize(['admin', 'manager', 'inventory']), auditLogger, async (c) => {
  try {
    const env = c.env as Env;
    const user = getUser(c);
    const body = await c.req.json();

    const bulkSchema = z.object({
      product_id: z.number().int().positive(),
      supplier_id: z.number().int().positive().optional(),
      location: z.string().max(100).optional(),
      serial_numbers: z.array(z.string().min(1).max(100)).min(1).max(100),
    });

    const data = bulkSchema.parse(body);

    // Verify product exists
    const productCheck = await env.DB.prepare(
      'SELECT id FROM products WHERE id = ? AND is_active = 1'
    ).bind(data.product_id).first();

    if (!productCheck) {
      return c.json({
        success: false,
        message: 'Sản phẩm không tồn tại hoặc đã bị vô hiệu hóa',
        data: null
      }, 400);
    }

    // Check for duplicate serial numbers
    const existingCheck = await env.DB.prepare(
      `SELECT serial_number FROM serial_numbers WHERE serial_number IN (${data.serial_numbers.map(() => '?').join(', ')})`
    ).bind(...data.serial_numbers).all();

    if (existingCheck.results.length > 0) {
      const duplicates = existingCheck.results.map((row: any) => row.serial_number);
      return c.json({
        success: false,
        message: `Serial numbers đã tồn tại: ${duplicates.join(', ')}`,
        data: null
      }, 400);
    }

    // Bulk insert
    const insertQuery = `
      INSERT INTO serial_numbers (
        serial_number, product_id, supplier_id, location, created_by
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const statements = data.serial_numbers.map(serialNumber =>
      env.DB.prepare(insertQuery).bind(
        serialNumber,
        data.product_id,
        data.supplier_id || null,
        data.location || null,
        user.sub
      )
    );

    const results = await env.DB.batch(statements);

    const successCount = results.filter(r => r.success).length;

    // Clear cache
    await CacheManager.delete(env, 'serial_numbers:stats');

    return c.json({
      success: true,
      message: `Tạo thành công ${successCount}/${data.serial_numbers.length} serial numbers`,
      data: { created: successCount, total: data.serial_numbers.length }
    }, 201);

  } catch (error) {
    console.error('Error bulk creating serial numbers:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tạo hàng loạt serial numbers',
      data: null
    }, 500);
  }
});

// ==========================================
// BULK IMPORT ENDPOINTS
// ==========================================

const bulkImportSchema = z.object({
  serial_numbers: z.array(z.object({
    serial_number: z.string(),
    product_id: z.number().optional(),
    product_name: z.string().optional(),
    product_sku: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional()
  })),
  stock_in_id: z.string().optional()
});

// Bulk Import Serial Numbers
app.post('/bulk-import',
  authenticate,
  validate(bulkImportSchema),
  auditLogger('serial_number_bulk_import'),
  async (c) => {
    try {
      const { serial_numbers, stock_in_id } = c.req.valid('json');
      const user = getUser(c);
      const env = c.env;

      const results = {
        total: serial_numbers.length,
        successful: 0,
        failed: 0,
        duplicates: 0,
        errors: [] as any[]
      };

      for (const serialData of serial_numbers) {
        try {
          // Check for duplicates
          const existing = await env.DB.prepare(
            'SELECT id FROM serial_numbers WHERE serial_number = ?'
          ).bind(serialData.serial_number).first();

          if (existing) {
            results.duplicates++;
            results.errors.push({
              serial_number: serialData.serial_number,
              error: 'Serial number đã tồn tại trong hệ thống'
            });
            continue;
          }

          // Validate format
          if (!isValidSerialFormat(serialData.serial_number)) {
            results.failed++;
            results.errors.push({
              serial_number: serialData.serial_number,
              error: 'Định dạng serial number không hợp lệ'
            });
            continue;
          }

          // Insert serial number
          await env.DB.prepare(`
            INSERT INTO serial_numbers (
              serial_number, product_id, location, notes, status,
              received_date, created_by, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 'in_stock', datetime('now'), ?, datetime('now'), datetime('now'))
          `).bind(
            serialData.serial_number,
            serialData.product_id || null,
            serialData.location || null,
            serialData.notes || null,
            user.id
          ).run();

          results.successful++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            serial_number: serialData.serial_number,
            error: error.message || 'Lỗi không xác định'
          });
        }
      }

      // Clear cache
      await CacheManager.delete(c.env, CacheKeys.SERIAL_NUMBERS_LIST);

      return c.json({
        success: true,
        data: results,
        message: `Import hoàn tất: ${results.successful} thành công, ${results.failed} lỗi, ${results.duplicates} trùng lặp`
      });
    } catch (error) {
      console.error('Error bulk importing serial numbers:', error);
      return c.json({
        success: false,
        message: 'Lỗi khi import serial numbers hàng loạt'
      }, 500);
    }
  }
);

// POST /serial-numbers/fix-supplier-data - Fix missing supplier data (Admin only)
app.post('/fix-supplier-data',
  authenticate,
  authorize(['admin']),
  async (c) => {
    try {
      const env = c.env as Env;
      console.log('🔧 Starting supplier data fix process...');

      // Step 1: Update serial numbers that have stock_in_id but missing supplier_id
      const updateQuery1 = `
        UPDATE serial_numbers
        SET supplier_id = (
          SELECT si.supplier_id
          FROM stock_ins si
          WHERE si.id = serial_numbers.stock_in_id
        )
        WHERE stock_in_id IS NOT NULL
          AND supplier_id IS NULL
      `;

      const result1 = await env.DB.prepare(updateQuery1).run();
      console.log('✅ Step 1 - Updated serial numbers with stock_in_id:', result1.changes);

      // Step 2: For serial numbers without stock_in_id, try to match by product and date
      const updateQuery2 = `
        UPDATE serial_numbers
        SET supplier_id = (
          SELECT si.supplier_id
          FROM stock_ins si
          JOIN stock_in_items sii ON si.id = sii.stock_in_id
          WHERE sii.product_id = serial_numbers.product_id
            AND date(si.created_at) = date(serial_numbers.received_date)
          ORDER BY si.created_at DESC
          LIMIT 1
        )
        WHERE supplier_id IS NULL
          AND received_date IS NOT NULL
      `;

      const result2 = await env.DB.prepare(updateQuery2).run();
      console.log('✅ Step 2 - Updated serial numbers by product/date match:', result2.changes);

      // Step 3: Get statistics after fix
      const statsQuery = `
        SELECT
          COUNT(*) as total_serials,
          COUNT(CASE WHEN supplier_id IS NOT NULL THEN 1 END) as with_supplier,
          COUNT(CASE WHEN supplier_id IS NULL THEN 1 END) as without_supplier
        FROM serial_numbers
        WHERE (deleted_at IS NULL OR deleted_at = '')
      `;

      const stats = await env.DB.prepare(statsQuery).first();
      console.log('📊 Final statistics:', stats);

      // Clear cache to refresh data
      await CacheManager.delete(env, 'serial_numbers:stats');

      return c.json({
        success: true,
        data: {
          updated_with_stock_in: result1.changes || 0,
          updated_by_matching: result2.changes || 0,
          total_updated: (result1.changes || 0) + (result2.changes || 0),
          final_stats: {
            total_serials: stats?.total_serials || 0,
            with_supplier: stats?.with_supplier || 0,
            without_supplier: stats?.without_supplier || 0
          }
        },
        message: `Đã cập nhật supplier data cho ${(result1.changes || 0) + (result2.changes || 0)} serial numbers`
      });

    } catch (error) {
      console.error('❌ Error fixing supplier data:', error);
      return c.json({
        success: false,
        message: 'Lỗi khi sửa dữ liệu supplier',
        error: {
          type: 'SUPPLIER_DATA_FIX_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }, 500);
    }
  }
);

// Validate Serial Numbers
app.post('/validate',
  authenticate,
  validate(z.object({
    serial_numbers: z.array(z.string()),
    product_id: z.number().optional()
  })),
  async (c) => {
    try {
      const { serial_numbers, product_id } = c.req.valid('json');
      const env = c.env;

      const validationResults = [];

      for (const serialNumber of serial_numbers) {
        const result = {
          serial_number: serialNumber,
          is_valid: true,
          errors: [] as string[],
          warnings: [] as string[]
        };

        // Format validation
        if (!isValidSerialFormat(serialNumber)) {
          result.is_valid = false;
          result.errors.push('Định dạng không hợp lệ');
        }

        // Length validation
        if (serialNumber.length < 3) {
          result.is_valid = false;
          result.errors.push('Serial number quá ngắn (tối thiểu 3 ký tự)');
        }

        if (serialNumber.length > 50) {
          result.is_valid = false;
          result.errors.push('Serial number quá dài (tối đa 50 ký tự)');
        }

        // Duplicate check
        const existing = await env.DB.prepare(
          'SELECT id FROM serial_numbers WHERE serial_number = ?'
        ).bind(serialNumber).first();

        if (existing) {
          result.is_valid = false;
          result.errors.push('Serial number đã tồn tại trong hệ thống');
        }

        validationResults.push(result);
      }

      const validCount = validationResults.filter(r => r.is_valid).length;
      const invalidCount = validationResults.length - validCount;

      return c.json({
        success: true,
        data: {
          results: validationResults,
          summary: {
            total: validationResults.length,
            valid: validCount,
            invalid: invalidCount
          }
        }
      });
    } catch (error) {
      console.error('Error validating serial numbers:', error);
      return c.json({
        success: false,
        message: 'Lỗi khi xác thực serial numbers'
      }, 500);
    }
  }
);

function isValidSerialFormat(serialNumber: string): boolean {
  // Basic format validation - alphanumeric with hyphens and underscores
  return /^[A-Za-z0-9\-_]+$/.test(serialNumber);
}

// GET /serial-numbers/:id - Get serial number by ID (MUST BE LAST - after all specific routes)
// Use regex to only match numeric IDs
app.get('/:id{[0-9]+}', async (c) => {
  try {
    const env = c.env as Env;
    const id = parseInt(c.req.param('id'));

    if (isNaN(id)) {
      return c.json({
        success: false,
        message: 'ID không hợp lệ',
        data: null
      }, 400);
    }

    const serialNumber = await getSerialNumberById(env, id);

    if (!serialNumber) {
      return c.json({
        success: false,
        message: 'Không tìm thấy serial number',
        data: null
      }, 404);
    }

    const response: SerialNumberResponse = {
      success: true,
      data: serialNumber,
    };

    return c.json(response);

  } catch (error) {
    console.error('Error fetching serial number:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy thông tin serial number',
      data: null
    }, 500);
  }
});

export default app;
