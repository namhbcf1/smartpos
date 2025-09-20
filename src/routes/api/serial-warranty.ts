import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// GET /api/serial-warranty/serials - List serial numbers
app.get('/serials', async (c: any) => {
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
        p.warranty_period,
        c.full_name as customer_name,
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
      conditions.push(`(sn.serial_number LIKE ? OR p.name LIKE ? OR c.full_name LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY sn.created_at DESC`;
    
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
        total: result.results?.length || 0,
        pages: Math.ceil((result.results?.length || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Serial numbers list error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch serial numbers',
      data: []
    }, 500);
  }
});

// POST /api/serial-warranty/serials - Create serial number
app.post('/serials', async (c: any) => {
  try {
    const data = await c.req.json();
    const { serial_number, product_id, customer_id, purchase_date, notes } = data;
    
    if (!serial_number || !product_id) {
      return c.json({ success: false, error: 'Serial number and product ID are required' }, 400);
    }
    
    // Check if serial number already exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM serial_numbers WHERE serial_number = ?
    `).bind(serial_number).first();
    
    if (existing) {
      return c.json({ success: false, error: 'Serial number already exists' }, 400);
    }
    
    // Get product warranty info
    const product = await c.env.DB.prepare(`
      SELECT warranty_period FROM products WHERE id = ?
    `).bind(product_id).first() as any;

    const warrantyMonths = product?.warranty_period || 12;
    const warrantyStartDate = purchase_date || new Date().toISOString();
    const warrantyEndDate = new Date(new Date(warrantyStartDate).getTime() + warrantyMonths * 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const serialId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO serial_numbers (
        id, serial_number, product_id, customer_id, status,
        purchase_date, warranty_start_date, warranty_end_date,
        notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      serialId, serial_number, product_id, customer_id || null, 'active',
      purchase_date || new Date().toISOString(), warrantyStartDate, warrantyEndDate, notes
    ).run();
    
    // Get created serial number
    const serial = await c.env.DB.prepare(`
      SELECT 
        sn.*,
        p.name as product_name,
        p.sku,
        c.full_name as customer_name
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
    return c.json({ success: false, error: 'Failed to create serial number' }, 500);
  }
});

// GET /api/serial-warranty/warranty-claims - List warranty claims
app.get('/warranty-claims', async (c: any) => {
  try {
    const { page = '1', limit = '50', status, serial_id, customer_id } = c.req.query();
    
    let query = `
      SELECT 
        wc.id,
        wc.serial_number_id,
        wc.customer_id,
        wc.issue_description,
        wc.reported_date,
        wc.status,
        wc.resolution_notes,
        wc.resolved_date,
        wc.created_at,
        wc.updated_at,
        sn.serial_number,
        p.name as product_name,
        p.sku,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email
      FROM warranty_claims wc
      LEFT JOIN serial_numbers sn ON wc.serial_number_id = sn.id
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON wc.customer_id = c.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (status) {
      conditions.push(`wc.status = ?`);
      params.push(status);
    }
    
    if (serial_id) {
      conditions.push(`wc.serial_number_id = ?`);
      params.push(serial_id);
    }
    
    if (customer_id) {
      conditions.push(`wc.customer_id = ?`);
      params.push(customer_id);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY wc.reported_date DESC`;
    
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
        total: result.results?.length || 0,
        pages: Math.ceil((result.results?.length || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Warranty claims list error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch warranty claims',
      data: []
    }, 500);
  }
});

// POST /api/serial-warranty/warranty-claims - Create warranty claim
app.post('/warranty-claims', async (c: any) => {
  try {
    const data = await c.req.json();
    const { serial_number_id, customer_id, issue_description, reported_date } = data;
    
    if (!serial_number_id || !customer_id || !issue_description) {
      return c.json({ success: false, error: 'Serial number ID, customer ID, and issue description are required' }, 400);
    }
    
    // Check if serial number exists and is under warranty
    const serial = await c.env.DB.prepare(`
      SELECT 
        sn.*,
        p.name as product_name,
        p.warranty_period
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      WHERE sn.id = ?
    `).bind(serial_number_id).first() as any;
    
    if (!serial) {
      return c.json({ success: false, error: 'Serial number not found' }, 404);
    }
    
    const now = new Date();
    const warrantyEnd = new Date(serial.warranty_end_date);
    
    if (now > warrantyEnd) {
      return c.json({ success: false, error: 'Warranty has expired' }, 400);
    }
    
    const claimId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO warranty_claims (
        id, serial_number_id, customer_id, issue_description,
        reported_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      claimId, serial_number_id, customer_id, issue_description,
      reported_date || new Date().toISOString(), 'submitted'
    ).run();
    
    // Get created warranty claim
    const claim = await c.env.DB.prepare(`
      SELECT 
        wc.*,
        sn.serial_number,
        p.name as product_name,
        p.sku,
        c.full_name as customer_name
      FROM warranty_claims wc
      LEFT JOIN serial_numbers sn ON wc.serial_number_id = sn.id
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON wc.customer_id = c.id
      WHERE wc.id = ?
    `).bind(claimId).first();
    
    return c.json({
      success: true,
      data: claim,
      message: 'Warranty claim created successfully'
    }, 201);
  } catch (error) {
    console.error('Create warranty claim error:', error);
    return c.json({ success: false, error: 'Failed to create warranty claim' }, 500);
  }
});

// PUT /api/serial-warranty/warranty-claims/:id/resolve - Resolve warranty claim
app.put('/warranty-claims/:id/resolve', async (c: any) => {
  try {
    const id = c.req.param('id');
    const { resolution_notes, status = 'resolved' } = await c.req.json();
    
    await c.env.DB.prepare(`
      UPDATE warranty_claims 
      SET status = ?, resolution_notes = ?, resolved_date = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).bind(status, resolution_notes, id).run();
    
    return c.json({
      success: true,
      message: 'Warranty claim resolved successfully'
    });
  } catch (error) {
    console.error('Resolve warranty claim error:', error);
    return c.json({ success: false, error: 'Failed to resolve warranty claim' }, 500);
  }
});

// GET /api/serial-warranty/warranty-registrations - List warranty registrations
app.get('/warranty-registrations', async (c: any) => {
  try {
    const { page = '1', limit = '50', customer_id, product_id } = c.req.query();
    
    let query = `
      SELECT 
        wr.id,
        wr.serial_number_id,
        wr.customer_id,
        wr.registration_date,
        wr.warranty_start_date,
        wr.warranty_end_date,
        wr.status,
        wr.notes,
        wr.created_at,
        wr.updated_at,
        sn.serial_number,
        p.name as product_name,
        p.sku,
        c.full_name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email
      FROM warranty_registrations wr
      LEFT JOIN serial_numbers sn ON wr.serial_number_id = sn.id
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON wr.customer_id = c.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (customer_id) {
      conditions.push(`wr.customer_id = ?`);
      params.push(customer_id);
    }
    
    if (product_id) {
      conditions.push(`sn.product_id = ?`);
      params.push(product_id);
    }
    
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY wr.registration_date DESC`;
    
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
        total: result.results?.length || 0,
        pages: Math.ceil((result.results?.length || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Warranty registrations list error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch warranty registrations',
      data: []
    }, 500);
  }
});

// POST /api/serial-warranty/warranty-registrations - Register warranty
app.post('/warranty-registrations', async (c: any) => {
  try {
    const data = await c.req.json();
    const { serial_number_id, customer_id, registration_date, notes } = data;
    
    if (!serial_number_id || !customer_id) {
      return c.json({ success: false, error: 'Serial number ID and customer ID are required' }, 400);
    }
    
    // Check if already registered
    const existing = await c.env.DB.prepare(`
      SELECT id FROM warranty_registrations WHERE serial_number_id = ?
    `).bind(serial_number_id).first();
    
    if (existing) {
      return c.json({ success: false, error: 'Warranty already registered for this serial number' }, 400);
    }
    
    // Get serial number and product info
    const serial = await c.env.DB.prepare(`
      SELECT 
        sn.*,
        p.name as product_name,
        p.warranty_period
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      WHERE sn.id = ?
    `).bind(serial_number_id).first() as any;
    
    if (!serial) {
      return c.json({ success: false, error: 'Serial number not found' }, 404);
    }
    
    const warrantyMonths = serial.warranty_months || 12;
    const warrantyStartDate = registration_date || new Date().toISOString();
    const warrantyEndDate = new Date(new Date(warrantyStartDate).getTime() + warrantyMonths * 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const registrationId = crypto.randomUUID();
    
    await c.env.DB.prepare(`
      INSERT INTO warranty_registrations (
        id, serial_number_id, customer_id, registration_date,
        warranty_start_date, warranty_end_date, status, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      registrationId, serial_number_id, customer_id, warrantyStartDate,
      warrantyStartDate, warrantyEndDate, 'active', notes
    ).run();
    
    // Get created warranty registration
    const registration = await c.env.DB.prepare(`
      SELECT 
        wr.*,
        sn.serial_number,
        p.name as product_name,
        p.sku,
        c.full_name as customer_name
      FROM warranty_registrations wr
      LEFT JOIN serial_numbers sn ON wr.serial_number_id = sn.id
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON wr.customer_id = c.id
      WHERE wr.id = ?
    `).bind(registrationId).first();
    
    return c.json({
      success: true,
      data: registration,
      message: 'Warranty registered successfully'
    }, 201);
  } catch (error) {
    console.error('Register warranty error:', error);
    return c.json({ success: false, error: 'Failed to register warranty' }, 500);
  }
});

// GET /api/serial-warranty/stats - Get serial and warranty statistics
app.get('/stats', async (c: any) => {
  try {
    // Get serial number stats
    const serialStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_serials,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_serials,
        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold_serials,
        SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned_serials,
        SUM(CASE WHEN warranty_end_date > datetime('now') THEN 1 ELSE 0 END) as under_warranty,
        SUM(CASE WHEN warranty_end_date <= datetime('now') THEN 1 ELSE 0 END) as expired_warranty
      FROM serial_numbers
    `).first();
    
    // Get warranty claim stats
    const claimStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_claims,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as pending_claims,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_claims,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_claims
      FROM warranty_claims
    `).first();
    
    // Get expiring warranties (next 30 days)
    const expiringWarranties = await c.env.DB.prepare(`
      SELECT 
        sn.serial_number,
        p.name as product_name,
        c.full_name as customer_name,
        sn.warranty_end_date
      FROM serial_numbers sn
      LEFT JOIN products p ON sn.product_id = p.id
      LEFT JOIN customers c ON sn.customer_id = c.id
      WHERE sn.warranty_end_date BETWEEN datetime('now') AND datetime('now', '+30 days')
        AND sn.status = 'sold'
      ORDER BY sn.warranty_end_date ASC
      LIMIT 10
    `).all();
    
    return c.json({
      success: true,
      data: {
        serial_stats: serialStats,
        claim_stats: claimStats,
        expiring_warranties: expiringWarranties.results || []
      }
    });
  } catch (error) {
    console.error('Serial warranty stats error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch serial warranty statistics'
    }, 500);
  }
});

export default app;
