import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, getUser } from '../../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all routes
app.use('*', authenticate);

// GET /api/products - List products with search, filter, pagination
app.get('/', async (c: any) => {
  try {
    // Ensure products table exists - COMPLETE SCHEMA
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        barcode TEXT UNIQUE,
        description TEXT,
        price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
        cost_price_cents INTEGER NOT NULL CHECK (cost_price_cents >= 0),
        stock INTEGER DEFAULT 0 CHECK (stock >= 0),
        min_stock INTEGER DEFAULT 0 CHECK (min_stock >= 0),
        max_stock INTEGER DEFAULT 1000 CHECK (max_stock >= min_stock),
        unit TEXT DEFAULT 'piece',
        weight_grams INTEGER CHECK (weight_grams >= 0),
        dimensions TEXT,
        category_id TEXT,
        brand_id TEXT,
        supplier_id TEXT,
        store_id TEXT DEFAULT 'store-1',
        image_url TEXT,
        images TEXT,
        category_name TEXT,
        brand_name TEXT,
        is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
        is_serialized INTEGER DEFAULT 0 CHECK (is_serialized IN (0, 1)),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // Ensure categories table exists
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        parent_id TEXT,
        image_url TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // Ensure brands table exists
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS brands (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        website TEXT,
        logo_url TEXT,
        is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // Ensure suppliers table exists
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        phone TEXT,
        address TEXT,
        tax_number TEXT,
        payment_terms TEXT,
        credit_limit_cents INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `).run();

    // Add missing columns to existing products table if they don't exist
    try {
      await c.env.DB.prepare(`ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 0`).run();
    } catch (e) { /* column already exists */ }

    try {
      await c.env.DB.prepare(`ALTER TABLE products ADD COLUMN max_stock INTEGER DEFAULT 1000`).run();
    } catch (e) { /* column already exists */ }

    try {
      await c.env.DB.prepare(`ALTER TABLE products ADD COLUMN price_cents INTEGER DEFAULT 0`).run();
    } catch (e) { /* column already exists */ }

    try {
      await c.env.DB.prepare(`ALTER TABLE products ADD COLUMN cost_price_cents INTEGER DEFAULT 0`).run();
    } catch (e) { /* column already exists */ }

    const {
      page = '1',
      limit = '50',
      search,
      category_id,
      brand_id,
      supplier_id,
      status = 'active',
      sort_by = 'name',
      sort_order = 'asc',
      low_stock,
      in_stock_only
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE p.is_active = 1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category_id) {
      whereClause += ' AND p.category_id = ?';
      params.push(category_id);
    }

    if (brand_id) {
      whereClause += ' AND p.brand_id = ?';
      params.push(brand_id);
    }

    if (supplier_id) {
      whereClause += ' AND p.supplier_id = ?';
      params.push(supplier_id);
    }

    if (status === 'inactive') {
      whereClause = 'WHERE p.is_active = 0';
    }

    if (low_stock === 'true') {
      whereClause += ' AND p.stock <= p.min_stock';
    }

    const allowedSortFields = ['name', 'sku', 'price_cents', 'stock', 'created_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'name';
    const sortDirection = sort_order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Use simplified query to avoid JOIN errors with missing tables
    const query = `
      SELECT
        p.*,
        CASE
          WHEN p.stock <= 0 THEN 'out_of_stock'
          WHEN p.stock <= COALESCE(p.min_stock, 0) THEN 'low_stock'
          WHEN p.stock >= COALESCE(p.max_stock, 999999) THEN 'overstock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p
      ${whereClause}
      ORDER BY p.${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `;

    const [products, countResult] = await Promise.all([
      c.env.DB.prepare(query).bind(...params, parseInt(limit), offset).all(),
      c.env.DB.prepare(countQuery).bind(...params).first()
    ]);

    return c.json({
      success: true,
      data: products.results || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult?.total || 0,
        pages: Math.ceil((countResult?.total || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Products list error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// GET /api/products/low-stock - Get low stock products (must come before /:id)
app.get('/low-stock', async (c: any) => {
  try {
    const { threshold } = c.req.query();
    const stockThreshold = threshold ? parseInt(threshold) : null;

    let whereClause = 'WHERE p.is_active = 1 AND (p.stock <= p.min_stock_level OR p.stock <= p.minStock)';
    const params: any[] = [];

    if (stockThreshold !== null) {
      whereClause = 'WHERE p.is_active = 1 AND p.stock <= ?';
      params.push(stockThreshold);
    }

    // Try a basic query first to see what columns exist
    const products = await c.env.DB.prepare(`
      SELECT *
      FROM products p
      ${whereClause}
      ORDER BY p.name
      LIMIT 10
    `).bind(...params).all();

    return c.json({
      success: true,
      data: products.results || []
    });
  } catch (error) {
    console.error('Low stock products error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch low stock products'
    }, 500);
  }
});

// GET /api/products/barcode/:barcode - Get product by barcode (must come before /:id)
app.get('/barcode/:barcode', async (c: any) => {
  try {
    const barcode = c.req.param('barcode');

    const product = await c.env.DB.prepare(`
      SELECT
        p.*,
        c.name as category_name,
        b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.barcode = ? AND p.is_active = 1
    `).bind(barcode).first();

    if (!product) {
      return c.json({
        success: false,
        message: 'Product not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Barcode lookup error:', error);
    return c.json({
      success: false,
      message: 'Failed to find product by barcode'
    }, 500);
  }
});

// GET /api/products/:id - Get product by ID
app.get('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');

    const product = await c.env.DB.prepare(`
      SELECT
        p.*,
        c.name as category_name,
        b.name as brand_name,
        s.name as supplier_name,
        s.contact_person as supplier_contact,
        s.phone as supplier_phone,
        CASE
          WHEN p.stock <= 0 THEN 'out_of_stock'
          WHEN p.stock <= p.min_stock THEN 'low_stock'
          WHEN p.stock >= p.max_stock THEN 'overstock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `).bind(id).first();

    if (!product) {
      return c.json({
        success: false,
        message: 'Product not found'
      }, 404);
    }

    // Get product variants if any
    const variants = await c.env.DB.prepare(`
      SELECT id, variant_name, variant_value, sku, barcode, price_adjustment, cost_adjustment, stock, is_active
      FROM product_variants
      WHERE product_id = ? AND is_active = 1
      ORDER BY variant_name
    `).bind(id).all();

    // Get recent inventory movements
    const movements = await c.env.DB.prepare(`
      SELECT
        im.id, im.transaction_type, im.quantity, im.reference_type,
        im.reference_id, im.notes, im.created_at,
        u.username as user_id_name
      FROM inventory_movements im
      LEFT JOIN users u ON im.user_id = u.id
      WHERE im.product_id = ?
      ORDER BY im.created_at DESC
      LIMIT 10
    `).bind(id).all();

    return c.json({
      success: true,
      data: {
        ...product,
        variants: variants.results || [],
        recent_movements: movements.results || []
      }
    });
  } catch (error) {
    console.error('Product detail error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch product'
    }, 500);
  }
});

// POST /api/products - Create new product
app.post('/', async (c: any) => {
  try {
    const user = getUser(c);
    const data = await c.req.json();

    const {
      name, description, sku, barcode, category_id, brand_id, supplier_id,
      price_cents, cost_price_cents, stock = 0, min_stock = 0, max_stock = 100, unit = 'piece',
      weight_grams, dimensions, image_url, images, is_serialized = 0
    } = data;

    if (!name || !sku || price_cents === undefined) {
      return c.json({
        success: false,
        message: 'Name, SKU, and price_cents are required'
      }, 400);
    }

    // Check if SKU already exists
    const existingSku = await c.env.DB.prepare(`
      SELECT id FROM products WHERE sku = ?
    `).bind(sku).first();

    if (existingSku) {
      return c.json({
        success: false,
        message: 'Product with this SKU already exists'
      }, 400);
    }

    // Check if barcode already exists (if provided)
    if (barcode) {
      const existingBarcode = await c.env.DB.prepare(`
        SELECT id FROM products WHERE barcode = ?
      `).bind(barcode).first();

      if (existingBarcode) {
        return c.json({
          success: false,
          message: 'Product with this barcode already exists'
        }, 400);
      }
    }

    // Generate product ID
    const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Insert product using actual database schema columns
    await c.env.DB.prepare(`
      INSERT INTO products (
        id, name, description, sku, barcode, category_id, supplier_id,
        selling_price, cost_price, stock, min_stock, max_stock, unit_type, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      productId, name, description || null, sku, barcode || null, category_id || null, supplier_id || null,
      (price_cents || 0) / 100, // Convert cents to VND for selling_price
      (cost_price_cents || 0) / 100, // Convert cents to VND for cost_price
      stock || 0, min_stock || 0, max_stock || 100, unit || 'piece', 1
    ).run();

    // Skip inventory movement creation for now

    // Get the created product
    const createdProduct = await c.env.DB.prepare(`
      SELECT * FROM products WHERE id = ?
    `).bind(productId).first();

    return c.json({
      success: true,
      data: createdProduct,
      message: 'Product created successfully'
    }, 201);
  } catch (error) {
    console.error('Product creation error:', error);
    return c.json({
      success: false,
      message: 'Failed to create product',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// PUT /api/products/:id - Update product
app.put('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();

    // Check if product exists
    const existingProduct = await c.env.DB.prepare(`
      SELECT id, sku, barcode FROM products WHERE id = ?
    `).bind(id).first();

    if (!existingProduct) {
      return c.json({
        success: false,
        message: 'Product not found'
      }, 404);
    }

    const {
      name, description, sku, barcode, category_id, brand_id, supplier_id,
      price_cents, cost_price_cents, min_stock, max_stock, unit,
      weight_grams, dimensions, image_url, images
    } = data;

    // Check SKU uniqueness if changed
    if (sku && sku !== existingProduct.sku) {
      const skuExists = await c.env.DB.prepare(`
        SELECT id FROM products WHERE sku = ? AND id != ?
      `).bind(sku, id).first();

      if (skuExists) {
        return c.json({
          success: false,
          message: 'Product with this SKU already exists'
        }, 400);
      }
    }

    // Check barcode uniqueness if changed
    if (barcode && barcode !== existingProduct.barcode) {
      const barcodeExists = await c.env.DB.prepare(`
        SELECT id FROM products WHERE barcode = ? AND id != ?
      `).bind(barcode, id).first();

      if (barcodeExists) {
        return c.json({
          success: false,
          message: 'Product with this barcode already exists'
        }, 400);
      }
    }

    // Update product - only update fields that are provided
    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (sku !== undefined) {
      updateFields.push('sku = ?');
      updateValues.push(sku);
    }
    if (barcode !== undefined) {
      updateFields.push('barcode = ?');
      updateValues.push(barcode);
    }
    if (category_id !== undefined) {
      updateFields.push('category_id = ?');
      updateValues.push(category_id);
    }
    if (supplier_id !== undefined) {
      updateFields.push('supplier_id = ?');
      updateValues.push(supplier_id);
    }
    if (price_cents !== undefined) {
      updateFields.push('selling_price = ?');
      updateValues.push(price_cents / 100); // Convert to VND for selling_price
    }
    if (cost_price_cents !== undefined) {
      updateFields.push('cost_price = ?');
      updateValues.push(cost_price_cents / 100); // Convert to VND for cost_price
    }
    if (min_stock !== undefined) {
      updateFields.push('min_stock = ?');
      updateValues.push(min_stock);
    }
    if (max_stock !== undefined) {
      updateFields.push('max_stock = ?');
      updateValues.push(max_stock);
    }
    if (unit !== undefined) {
      updateFields.push('unit_type = ?');
      updateValues.push(unit);
    }

    if (updateFields.length === 0) {
      return c.json({
        success: false,
        message: 'No fields to update'
      }, 400);
    }

    updateFields.push('updated_at = datetime("now")');
    updateValues.push(id);

    await c.env.DB.prepare(`
      UPDATE products SET ${updateFields.join(', ')} WHERE id = ?
    `).bind(...updateValues).run();

    // Get updated product
    const updatedProduct = await c.env.DB.prepare(`
      SELECT
        p.*,
        c.name as category_name,
        b.name as brand_name,
        s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = ?
    `).bind(id).first();

    return c.json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Product update error:', error);
    return c.json({
      success: false,
      message: 'Failed to update product'
    }, 500);
  }
});

// DELETE /api/products/:id - Soft delete product
app.delete('/:id', async (c: any) => {
  try {
    const id = c.req.param('id');
    const user = getUser(c);

    // Check if product exists
    const product = await c.env.DB.prepare(`
      SELECT id, name FROM products WHERE id = ?
    `).bind(id).first();

    if (!product) {
      return c.json({
        success: false,
        message: 'Product not found'
      }, 404);
    }

    // Soft delete (set is_active = 0)
    await c.env.DB.prepare(`
      UPDATE products
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(id).run();

    return c.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Product deletion error:', error);
    return c.json({
      success: false,
      message: 'Failed to delete product'
    }, 500);
  }
});

// POST /api/products/:id/stock-adjustment - Adjust product stock
app.post('/:id/stock-adjustment', async (c: any) => {
  try {
    const productId = c.req.param('id');
    const user = getUser(c);
    const { adjustment_type, quantity, reason, notes } = await c.req.json();

    if (!adjustment_type || quantity === undefined) {
      return c.json({
        success: false,
        message: 'Adjustment type and quantity are required'
      }, 400);
    }

    // Get current product
    const product = await c.env.DB.prepare(`
      SELECT id, name, stock FROM products WHERE id = ?
    `).bind(productId).first();

    if (!product) {
      return c.json({
        success: false,
        message: 'Product not found'
      }, 404);
    }

    let newStock = product.stock;
    let movementQuantity = 0;
    let movementType = '';

    switch (adjustment_type) {
      case 'increase':
        newStock += quantity;
        movementQuantity = quantity;
        movementType = 'in';
        break;
      case 'decrease':
        newStock = Math.max(0, newStock - quantity);
        movementQuantity = -Math.min(quantity, product.stock);
        movementType = 'out';
        break;
      case 'set':
        movementQuantity = quantity - product.stock;
        movementType = quantity > product.stock ? 'in' : 'out';
        newStock = quantity;
        break;
      default:
        return c.json({
          success: false,
          message: 'Invalid adjustment type'
        }, 400);
    }

    // Update stock
    await c.env.DB.prepare(`
      UPDATE products
      SET stock = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(newStock, productId).run();

    // Record inventory movement
    const movementId = `mov_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    await c.env.DB.prepare(`
      INSERT INTO inventory_movements (
        id, product_id, transaction_type, quantity, reference_type,
        reference_id, notes, user_id, created_at
      ) VALUES (?, ?, ?, ?, 'adjustment', ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      movementId, productId, movementType, Math.abs(movementQuantity),
      movementId, `${reason || 'Manual adjustment'} - ${notes || ''}`, user.id
    ).run().catch(() => {});

    // Record in audit trail
    await c.env.DB.prepare(`
      INSERT INTO inventory_audit (
        product_id, action_type, quantity_before, quantity_after,
        quantity_change, reference_type, reference_id, notes, user_id
      ) VALUES (?, 'adjustment', ?, ?, ?, 'manual_adjustment', ?, ?, ?)
    `).bind(
      productId, product.stock, newStock, movementQuantity,
      movementId, `${reason || 'Manual adjustment'} - ${notes || ''}`, user.id
    ).run().catch(() => {});

    return c.json({
      success: true,
      data: {
        product_id: productId,
        old_stock: product.stock,
        new_stock: newStock,
        adjustment: movementQuantity,
        movement_id: movementId
      },
      message: 'Stock adjusted successfully'
    });
  } catch (error) {
    console.error('Stock adjustment error:', error);
    return c.json({
      success: false,
      message: 'Failed to adjust stock'
    }, 500);
  }
});

// GET /api/products/:id/movements - Get product inventory movements
app.get('/:id/movements', async (c: any) => {
  try {
    const productId = c.req.param('id');
    const { page = '1', limit = '50' } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const movements = await c.env.DB.prepare(`
      SELECT
        im.id, im.transaction_type, im.quantity, im.reference_type,
        im.reference_id, im.notes, im.created_at,
        u.username as user_id_name,
        p.name as product_name, p.sku
      FROM inventory_movements im
      LEFT JOIN users u ON im.user_id = u.id
      LEFT JOIN products p ON im.product_id = p.id
      WHERE im.product_id = ?
      ORDER BY im.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(productId, parseInt(limit), offset).all();

    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM inventory_movements WHERE product_id = ?
    `).bind(productId).first();

    return c.json({
      success: true,
      data: movements.results || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult?.total || 0,
        pages: Math.ceil((countResult?.total || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Product movements error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch product movements'
    }, 500);
  }
});

export default app;