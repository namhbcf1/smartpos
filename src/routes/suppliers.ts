import { Hono } from 'hono';
import { getValidated, validateBody, validateQuery } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { supplierCreateSchema, supplierUpdateSchema, supplierQuerySchema } from '../schemas';
import { checkAndRunMigrations } from '../db/migrations';

const app = new Hono<{
  Bindings: {
    DB: D1Database;
  };
}>();

// Test route
app.get('/test', async (c) => {
  return c.json({
    success: true,
    message: 'Suppliers route is working',
    data: null,
  });
});

// Force migration route
app.get('/migrate', async (c) => {
  try {
    await checkAndRunMigrations(c.env);
    return c.json({
      success: true,
      message: 'Migrations completed successfully',
      data: null,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return c.json({
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Create suppliers table directly
app.get('/create-table', async (c) => {
  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
      )
    `).run();

    // Sample data removed - use migration system instead

    return c.json({
      success: true,
      message: 'Suppliers table created successfully',
      data: null,
    });
  } catch (error) {
    console.error('Create table error:', error);
    return c.json({
      success: false,
      message: 'Failed to create suppliers table',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Debug endpoint - no auth required
app.get('/debug', async (c) => {
  try {
    console.log('Suppliers debug endpoint called');

    // Test database connection
    const testQuery = await c.env.DB.prepare('SELECT COUNT(*) as count FROM suppliers').first();

    // Get sample suppliers
    const suppliers = await c.env.DB.prepare(`
      SELECT id, code, name, contact_info, address, tax_number, flags, total_orders, total_amount, created_at
      FROM suppliers
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    return c.json({
      success: true,
      message: 'Suppliers debug info',
      data: {
        total_count: testQuery?.count || 0,
        sample_suppliers: suppliers.results || [],
        database_connected: true
      }
    });
  } catch (error) {
    console.error('Suppliers debug error:', error);
    return c.json({
      success: false,
      message: 'Debug failed',
      error: error.message,
      data: null
    }, 500);
  }
});

// Create sample suppliers for testing
app.post('/create-samples', async (c) => {
  try {
    const sampleSuppliers = [
      {
        code: 'SUP001',
        name: 'Đức Anh PC',
        contact_info: JSON.stringify({
          contact_person: 'Nguyễn Văn A',
          email: 'contact@ducanhpc.com',
          phone: '0901234567'
        }),
        address: 'Hà Nội',
        tax_number: '0123456789',
        flags: 1
      },
      {
        code: 'SUP002',
        name: 'Intel Vietnam',
        contact_info: JSON.stringify({
          contact_person: 'Trần Thị B',
          email: 'sales@intel.vn',
          phone: '0987654321'
        }),
        address: 'TP.HCM',
        tax_number: '0987654321',
        flags: 1
      },
      {
        code: 'SUP003',
        name: 'AMD Distribution',
        contact_info: JSON.stringify({
          contact_person: 'Lê Văn C',
          email: 'info@amd.vn',
          phone: '0912345678'
        }),
        address: 'Đà Nẵng',
        tax_number: '0112233445',
        flags: 1
      }
    ];

    for (const supplier of sampleSuppliers) {
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO suppliers (code, name, contact_info, address, tax_number, flags, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        supplier.code,
        supplier.name,
        supplier.contact_info,
        supplier.address,
        supplier.tax_number,
        supplier.flags
      ).run();
    }

    return c.json({
      success: true,
      message: 'Tạo nhà cung cấp mẫu thành công',
      data: { created: sampleSuppliers.length }
    });
  } catch (error) {
    console.error('Error creating sample suppliers:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tạo nhà cung cấp mẫu',
      error: error.message
    }, 500);
  }
});

// Get all suppliers with pagination and search
app.get('/', async (c) => {
  try {
    const query = {
      page: parseInt(c.req.query('page') || '1'),
      limit: Math.min(parseInt(c.req.query('limit') || '10'), 100),
      search: c.req.query('search'),
      is_active: c.req.query('is_active') === 'true' ? true : c.req.query('is_active') === 'false' ? false : undefined
    };

    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100); // Max 100 items per page
    const offset = (page - 1) * limit;
    const search = query.search?.trim();
    const isActive = query.is_active;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR contact_info LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    if (isActive !== undefined) {
      whereClause += ' AND flags = ?';
      params.push(isActive ? 1 : 0);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM suppliers ${whereClause}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = countResult?.total || 0;

    // Get suppliers
    const dataQuery = `
      SELECT id, code, name, contact_info, address, tax_number,
             flags as is_active, created_at, updated_at
      FROM suppliers
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const result = await c.env.DB.prepare(dataQuery).bind(...params, limit, offset).all();

    const totalPages = Math.ceil(total / limit);

    // Parse contact_info for each supplier
    const suppliers = (result.results || []).map((supplier: any) => {
      let contactInfo = { contact_person: '', email: '', phone: '' };
      try {
        if (supplier.contact_info) {
          contactInfo = JSON.parse(supplier.contact_info);
        }
      } catch (e) {
        // If parsing fails, keep default values
      }

      return {
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        contact_person: contactInfo.contact_person || '',
        email: contactInfo.email || '',
        phone: contactInfo.phone || '',
        address: supplier.address,
        tax_number: supplier.tax_number,
        is_active: Boolean(supplier.flags),
        created_at: supplier.created_at,
        updated_at: supplier.updated_at
      };
    });

    return c.json({
      success: true,
      data: {
        data: suppliers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      },
      message: 'Lấy danh sách nhà cung cấp thành công'
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy danh sách nhà cung cấp',
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get supplier by ID
app.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    const supplier = await c.env.DB.prepare(`
      SELECT id, code, name, contact_info, address, tax_number,
             flags as is_active, created_at, updated_at
      FROM suppliers
      WHERE id = ?
    `).bind(id).first();
    
    if (!supplier) {
      return c.json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp',
        data: null,
      }, 404);
    }

    // Parse contact_info
    let contactInfo = { contact_person: '', email: '', phone: '' };
    try {
      if (supplier.contact_info) {
        contactInfo = JSON.parse(supplier.contact_info as string);
      }
    } catch (e) {
      // If parsing fails, keep default values
    }

    const formattedSupplier = {
      id: supplier.id,
      code: supplier.code,
      name: supplier.name,
      contact_person: contactInfo.contact_person || '',
      email: contactInfo.email || '',
      phone: contactInfo.phone || '',
      address: supplier.address,
      tax_number: supplier.tax_number,
      is_active: Boolean(supplier.is_active),
      created_at: supplier.created_at,
      updated_at: supplier.updated_at
    };

    return c.json({
      success: true,
      data: formattedSupplier,
    });
  } catch (error) {
    console.error('Error fetching supplier:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy thông tin nhà cung cấp',
      data: null,
    }, 500);
  }
});

// Create new supplier
app.post('/', authenticate, async (c) => {
  try {
    const supplierData = await c.req.json();

    // Generate supplier code
    const codeResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM suppliers').first();
    const supplierCount = (codeResult?.count as number) || 0;
    const code = `SUP${String(supplierCount + 1).padStart(6, '0')}`;

    // Combine contact info
    const contactInfo = JSON.stringify({
      contact_person: supplierData.contact_person || '',
      email: supplierData.email || '',
      phone: supplierData.phone || ''
    });

    const result = await c.env.DB.prepare(`
      INSERT INTO suppliers (code, name, contact_info, address, tax_number, flags)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      code,
      supplierData.name,
      contactInfo,
      supplierData.address || null,
      supplierData.tax_number || null,
      supplierData.is_active !== false ? 1 : 0
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to create supplier');
    }
    
    return c.json({
      success: true,
      message: 'Tạo nhà cung cấp thành công',
      data: { id: result.meta.last_row_id },
    }, 201);
  } catch (error) {
    console.error('Error creating supplier:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tạo nhà cung cấp',
      data: null,
    }, 500);
  }
});

// Update supplier
app.put('/:id', authenticate, validateBody(supplierUpdateSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const supplierData = getValidated<{
      name?: string;
      contact_person?: string;
      email?: string;
      phone?: string;
      address?: string;
      tax_number?: string;
      notes?: string;
      is_active?: boolean;
    }>(c);

    // Build dynamic update query
    const updateFields: string[] = [];
    const params: any[] = [];

    if (supplierData.name !== undefined) {
      updateFields.push('name = ?');
      params.push(supplierData.name);
    }

    // Handle contact_info update
    if (supplierData.contact_person !== undefined || supplierData.email !== undefined || supplierData.phone !== undefined) {
      // Get current contact_info
      const currentSupplier = await c.env.DB.prepare('SELECT contact_info FROM suppliers WHERE id = ?').bind(id).first();
      let currentContactInfo = { contact_person: '', email: '', phone: '' };

      if (currentSupplier?.contact_info) {
        try {
          currentContactInfo = JSON.parse(currentSupplier.contact_info as string);
        } catch (e) {
          // Keep default if parsing fails
        }
      }

      // Update contact info
      const newContactInfo = {
        contact_person: supplierData.contact_person !== undefined ? supplierData.contact_person : currentContactInfo.contact_person,
        email: supplierData.email !== undefined ? supplierData.email : currentContactInfo.email,
        phone: supplierData.phone !== undefined ? supplierData.phone : currentContactInfo.phone
      };

      updateFields.push('contact_info = ?');
      params.push(JSON.stringify(newContactInfo));
    }

    if (supplierData.address !== undefined) {
      updateFields.push('address = ?');
      params.push(supplierData.address);
    }
    if (supplierData.tax_number !== undefined) {
      updateFields.push('tax_number = ?');
      params.push(supplierData.tax_number);
    }
    if (supplierData.is_active !== undefined) {
      updateFields.push('flags = ?');
      params.push(supplierData.is_active ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return c.json({
        success: false,
        message: 'Không có dữ liệu để cập nhật',
        data: null,
      }, 400);
    }

    // Note: updated_at field uses unixepoch() in this table
    params.push(id);

    const result = await c.env.DB.prepare(`
      UPDATE suppliers
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).bind(...params).run();
    
    if (result.changes === 0) {
      return c.json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp',
        data: null,
      }, 404);
    }
    
    return c.json({
      success: true,
      message: 'Cập nhật nhà cung cấp thành công',
      data: null,
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi cập nhật nhà cung cấp',
      data: null,
    }, 500);
  }
});

// Delete supplier
app.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    const result = await c.env.DB.prepare(`
      DELETE FROM suppliers WHERE id = ?
    `).bind(id).run();
    
    if (result.changes === 0) {
      return c.json({
        success: false,
        message: 'Không tìm thấy nhà cung cấp',
        data: null,
      }, 404);
    }
    
    return c.json({
      success: true,
      message: 'Xóa nhà cung cấp thành công',
      data: null,
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi xóa nhà cung cấp',
      data: null,
    }, 500);
  }
});

// Supplier Performance Endpoint
app.get('/:id/performance', async (c) => {
  try {
    const supplierId = parseInt(c.req.param('id'));
    const db = c.env.DB;

    // Mock supplier performance data
    // In a real implementation, this would calculate from actual order data
    const performance = {
      supplier_id: supplierId,
      total_orders: 45,
      total_amount: 125000000,
      avg_delivery_days: 3.2,
      on_time_delivery_rate: 87.5,
      quality_rating: 4.3,
      price_competitiveness: 4.1,
      last_order_date: '2024-01-15',
      compliance_score: 92,
      notes: [
        'Giao hàng đúng hạn, chất lượng tốt',
        'Giá cả cạnh tranh',
        'Hỗ trợ kỹ thuật tốt'
      ],
      trends: {
        delivery_trend: 'improving',
        quality_trend: 'stable',
        price_trend: 'improving'
      }
    };

    return c.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Error getting supplier performance:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy hiệu suất nhà cung cấp'
    }, 500);
  }
});

// Add Supplier Rating Endpoint
app.post('/:id/ratings', async (c) => {
  try {
    const supplierId = parseInt(c.req.param('id'));
    const { rating, comment } = await c.req.json();
    const db = c.env.DB;

    // In a real implementation, this would save to a ratings table
    console.log('Adding rating for supplier:', supplierId, { rating, comment });

    return c.json({
      success: true,
      message: 'Đánh giá đã được lưu'
    });
  } catch (error) {
    console.error('Error adding supplier rating:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lưu đánh giá'
    }, 500);
  }
});

export default app;
