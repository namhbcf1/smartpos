import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// GET /api/v1/serial-numbers - Danh sách số seri
app.get('/', async (c: any) => {
  try {
    const { page = '1', limit = '50', product_id, status, customer_id, search } = c.req.query();

    let query = `
      SELECT
        sn.id,
        sn.serial_number,
        sn.product_id,
        sn.customer_id,
        sn.status,
        sn.purchase_date,
        sn.warranty_start_date,
        sn.warranty_end_date,
        sn.notes,
        sn.created_at,
        sn.updated_at,
        p.name as product_name,
        p.sku,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON sn.customer_id = c.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (product_id) {
      conditions.push(`sn.product_id = ?`);
      params.push(product_id);
    }

    if (status) {
      conditions.push(`sn.status = ?`);
      params.push(status);
    }

    if (customer_id) {
      conditions.push(`sn.customer_id = ?`);
      params.push(customer_id);
    }

    if (search) {
      conditions.push(`(sn.serial_number LIKE ? OR p.name LIKE ? OR c.name LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY sn.created_at DESC`;

    // Count total records
    let countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
    countQuery = countQuery.replace(/ ORDER BY[\s\S]*$/, '');
    const countResult = await c.env.DB.prepare(countQuery).bind(...params.slice(0, -2)).first() as any;
    const total = countResult?.total || 0;

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const result = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: result.results || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Serial numbers list error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch serial numbers',
      data: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        pages: 0
      }
    }, 500);
  }
});

// POST /api/v1/serial-numbers - Tạo số seri mới
app.post('/', async (c: any) => {
  try {
    const data = await c.req.json();
    const { serial_number, product_id, customer_id, purchase_date, notes } = data;

    if (!serial_number || !product_id) {
      return c.json({
        success: false,
        error: 'Serial number and product ID are required'
      }, 400);
    }

    // Check if serial number already exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM serial_numbers WHERE serial_number = ?
    `).bind(serial_number).first();

    if (existing) {
      return c.json({
        success: false,
        error: 'Serial number already exists'
      }, 400);
    }

    // Get product warranty info
    const product = await c.env.DB.prepare(`
      SELECT warranty_period FROM products WHERE id = ?
    `).bind(product_id).first() as any;

    const warrantyMonths = product?.warranty_period || 12;
    const warrantyStartDate = purchase_date || new Date().toISOString();
    const warrantyEndDate = new Date(
      new Date(warrantyStartDate).getTime() + warrantyMonths * 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const serialId = crypto.randomUUID();

    await c.env.DB.prepare(`
      INSERT INTO serial_numbers (
        id, serial_number, product_id, customer_id, status,
        purchase_date, warranty_start_date, warranty_end_date,
        notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      serialId,
      serial_number,
      product_id,
      customer_id || null,
      'active',
      purchase_date || new Date().toISOString(),
      warrantyStartDate,
      warrantyEndDate,
      notes || null
    ).run();

    // Get created serial number with related data
    const serial = await c.env.DB.prepare(`
      SELECT
        sn.*,
        p.name as product_name,
        p.sku,
        c.name as customer_name
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON sn.customer_id = c.id
      WHERE sn.id = ?
    `).bind(serialId).first();

    return c.json({
      success: true,
      data: serial,
      message: 'Serial number created successfully'
    }, 201);
  } catch (error) {
    console.error('Create serial number error:', error);
    return c.json({
      success: false,
      error: 'Failed to create serial number'
    }, 500);
  }
});

// PUT /api/v1/serial-numbers/:id - Cập nhật số seri
app.put('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    const { serial_number, product_id, customer_id, status, purchase_date, warranty_start_date, warranty_end_date, notes } = data;

    // Check if serial number exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM serial_numbers WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return c.json({
        success: false,
        error: 'Serial number not found'
      }, 404);
    }

    // If updating serial number, check for duplicates
    if (serial_number) {
      const duplicate = await c.env.DB.prepare(`
        SELECT id FROM serial_numbers WHERE serial_number = ? AND id != ?
      `).bind(serial_number, id).first();

      if (duplicate) {
        return c.json({
          success: false,
          error: 'Serial number already exists'
        }, 400);
      }
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateParams: any[] = [];

    if (serial_number !== undefined) {
      updateFields.push('serial_number = ?');
      updateParams.push(serial_number);
    }
    if (product_id !== undefined) {
      updateFields.push('product_id = ?');
      updateParams.push(product_id);
    }
    if (customer_id !== undefined) {
      updateFields.push('customer_id = ?');
      updateParams.push(customer_id);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateParams.push(status);
    }
    if (purchase_date !== undefined) {
      updateFields.push('purchase_date = ?');
      updateParams.push(purchase_date);
    }
    if (warranty_start_date !== undefined) {
      updateFields.push('warranty_start_date = ?');
      updateParams.push(warranty_start_date);
    }
    if (warranty_end_date !== undefined) {
      updateFields.push('warranty_end_date = ?');
      updateParams.push(warranty_end_date);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateParams.push(notes);
    }

    updateFields.push('updated_at = datetime(\'now\')');
    updateParams.push(id);

    await c.env.DB.prepare(`
      UPDATE serial_numbers
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `).bind(...updateParams).run();

    // Get updated serial number
    const updated = await c.env.DB.prepare(`
      SELECT
        sn.*,
        p.name as product_name,
        p.sku,
        c.name as customer_name
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON sn.customer_id = c.id
      WHERE sn.id = ?
    `).bind(id).first();

    return c.json({
      success: true,
      data: updated,
      message: 'Serial number updated successfully'
    });
  } catch (error) {
    console.error('Update serial number error:', error);
    return c.json({
      success: false,
      error: 'Failed to update serial number'
    }, 500);
  }
});

// DELETE /api/v1/serial-numbers/:id - Xóa số seri
app.delete('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');

    // Check if serial number exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM serial_numbers WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return c.json({
        success: false,
        error: 'Serial number not found'
      }, 404);
    }

    // Check if there are warranty claims or registrations
    const warranties = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM warranty_registrations WHERE serial_number_id = ?
    `).bind(id).first() as any;

    const claims = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM warranty_claims WHERE serial_number_id = ?
    `).bind(id).first() as any;

    if ((warranties?.count || 0) > 0 || (claims?.count || 0) > 0) {
      return c.json({
        success: false,
        error: 'Cannot delete serial number with existing warranty records'
      }, 400);
    }

    // Delete the serial number
    await c.env.DB.prepare(`
      DELETE FROM serial_numbers WHERE id = ?
    `).bind(id).run();

    return c.json({
      success: true,
      message: 'Serial number deleted successfully'
    });
  } catch (error) {
    console.error('Delete serial number error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete serial number'
    }, 500);
  }
});

// GET /api/v1/serial-numbers/stats - Thống kê số seri
app.get('/stats', async (c: any) => {
  try {
    // Get serial number stats
    const serialStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total_serials,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_serials,
        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold_serials,
        SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned_serials,
        SUM(CASE WHEN status = 'warranty' THEN 1 ELSE 0 END) as warranty_serials,
        SUM(CASE WHEN status = 'damaged' THEN 1 ELSE 0 END) as damaged_serials,
        SUM(CASE WHEN warranty_end_date > datetime('now') THEN 1 ELSE 0 END) as under_warranty,
        SUM(CASE WHEN warranty_end_date <= datetime('now') THEN 1 ELSE 0 END) as expired_warranty
      FROM serial_numbers
    `).first();

    // Get top products by serial count
    const topProducts = await c.env.DB.prepare(`
      SELECT
        p.name as product_name,
        p.sku,
        COUNT(sn.id) as serial_count
      FROM products p
      LEFT JOIN serial_numbers sn ON p.id = sn.product_id
      GROUP BY p.id, p.name, p.sku
      HAVING serial_count > 0
      ORDER BY serial_count DESC
      LIMIT 10
    `).all();

    // Get expiring warranties (next 30 days)
    const expiringWarranties = await c.env.DB.prepare(`
      SELECT
        sn.serial_number,
        sn.warranty_end_date,
        p.name as product_name,
        c.name as customer_name
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON sn.customer_id = c.id
      WHERE sn.warranty_end_date BETWEEN datetime('now') AND datetime('now', '+30 days')
        AND sn.status IN ('active', 'sold')
      ORDER BY sn.warranty_end_date ASC
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      data: {
        serial_stats: serialStats,
        top_products: topProducts.results || [],
        expiring_warranties: expiringWarranties.results || []
      }
    });
  } catch (error) {
    console.error('Serial numbers stats error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch statistics',
      data: {
        serial_stats: {
          total_serials: 0,
          active_serials: 0,
          sold_serials: 0,
          returned_serials: 0,
          warranty_serials: 0,
          damaged_serials: 0,
          under_warranty: 0,
          expired_warranty: 0
        },
        top_products: [],
        expiring_warranties: []
      }
    }, 500);
  }
});

// POST /api/v1/serial-numbers/bulk - Tạo hàng loạt
app.post('/bulk', async (c: any) => {
  try {
    const data = await c.req.json();
    const { serials, product_id, customer_id, purchase_date, notes } = data;

    if (!serials || !Array.isArray(serials) || serials.length === 0) {
      return c.json({
        success: false,
        error: 'Serials array is required and must not be empty'
      }, 400);
    }

    if (!product_id) {
      return c.json({
        success: false,
        error: 'Product ID is required'
      }, 400);
    }

    // Check for existing serial numbers
    const existingCheck = await Promise.all(
      serials.map(serial =>
        c.env.DB.prepare(`SELECT serial_number FROM serial_numbers WHERE serial_number = ?`)
          .bind(serial).first()
      )
    );

    const existingSerials = existingCheck
      .map((result, index) => result ? serials[index] : null)
      .filter(Boolean);

    if (existingSerials.length > 0) {
      return c.json({
        success: false,
        error: `Serial numbers already exist: ${existingSerials.join(', ')}`
      }, 400);
    }

    // Get product warranty info
    const product = await c.env.DB.prepare(`
      SELECT warranty_period FROM products WHERE id = ?
    `).bind(product_id).first() as any;

    const warrantyMonths = product?.warranty_period || 12;
    const warrantyStartDate = purchase_date || new Date().toISOString();
    const warrantyEndDate = new Date(
      new Date(warrantyStartDate).getTime() + warrantyMonths * 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Prepare batch insert
    const createdSerials = [];

    for (const serial of serials) {
      const serialId = crypto.randomUUID();

      await c.env.DB.prepare(`
        INSERT INTO serial_numbers (
          id, serial_number, product_id, customer_id, status,
          purchase_date, warranty_start_date, warranty_end_date,
          notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        serialId,
        serial,
        product_id,
        customer_id || null,
        'active',
        purchase_date || new Date().toISOString(),
        warrantyStartDate,
        warrantyEndDate,
        notes || null
      ).run();

      createdSerials.push({
        id: serialId,
        serial_number: serial
      });
    }

    return c.json({
      success: true,
      data: {
        created_count: createdSerials.length,
        serials: createdSerials
      },
      message: `Successfully created ${createdSerials.length} serial numbers`
    }, 201);
  } catch (error) {
    console.error('Bulk create serial numbers error:', error);
    return c.json({
      success: false,
      error: 'Failed to create serial numbers in bulk'
    }, 500);
  }
});

// GET /api/v1/serial-numbers/export - Xuất dữ liệu
app.get('/export', async (c: any) => {
  try {
    const { format = 'json', product_id, status, customer_id } = c.req.query();

    let query = `
      SELECT
        sn.serial_number,
        sn.status,
        sn.purchase_date,
        sn.warranty_start_date,
        sn.warranty_end_date,
        sn.notes,
        sn.created_at,
        p.name as product_name,
        p.sku as product_sku,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON sn.customer_id = c.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (product_id) {
      conditions.push(`sn.product_id = ?`);
      params.push(product_id);
    }

    if (status) {
      conditions.push(`sn.status = ?`);
      params.push(status);
    }

    if (customer_id) {
      conditions.push(`sn.customer_id = ?`);
      params.push(customer_id);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY sn.created_at DESC`;

    const result = await c.env.DB.prepare(query).bind(...params).all();
    const data = result.results || [];

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Serial Number', 'Status', 'Purchase Date', 'Warranty Start', 'Warranty End',
        'Notes', 'Created At', 'Product Name', 'Product SKU', 'Customer Name',
        'Customer Phone', 'Customer Email'
      ];

      const csvRows = [headers.join(',')];

      for (const row of data as any[]) {
        const values = [
          row.serial_number || '',
          row.status || '',
          row.purchase_date || '',
          row.warranty_start_date || '',
          row.warranty_end_date || '',
          (row.notes || '').replace(/"/g, '""'),
          row.created_at || '',
          (row.product_name || '').replace(/"/g, '""'),
          row.product_sku || '',
          (row.customer_name || '').replace(/"/g, '""'),
          row.customer_phone || '',
          row.customer_email || ''
        ];
        csvRows.push(values.map(v => `"${v}"`).join(','));
      }

      const csv = csvRows.join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="serial-numbers-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Default JSON format
    return c.json({
      success: true,
      data: data,
      exported_at: new Date().toISOString(),
      total_records: data.length
    });
  } catch (error) {
    console.error('Export serial numbers error:', error);
    return c.json({
      success: false,
      error: 'Failed to export serial numbers'
    }, 500);
  }
});

export default app;