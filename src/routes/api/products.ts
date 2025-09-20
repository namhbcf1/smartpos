import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, getUser } from '../../middleware/auth';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all routes
app.use('*', authenticate);

// GET /api/products - List products with search, filter, pagination
app.get('/', async (c: any) => {
  try {
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
      low_stock
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

    const query = `
      SELECT
        p.id, p.name, p.description, p.sku, p.barcode,
        p.category_id, p.brand_id, p.supplier_id, p.store_id,
        p.price_cents, p.cost_price_cents, p.stock, p.min_stock, p.max_stock, p.unit,
        p.weight_grams, p.dimensions, p.is_active, p.is_serialized,
        p.category_name, p.brand_name, p.image_url, p.images,
        p.created_at, p.updated_at,
        c.name as category_full_name,
        b.name as brand_full_name,
        s.name as supplier_name,
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
      message: 'Failed to fetch products'
    }, 500);
  }
});

// GET /api/products/low-stock - Get low stock products (must come before /:id)
app.get('/low-stock', async (c: any) => {
  try {
    const { threshold } = c.req.query();
    const stockThreshold = threshold ? parseInt(threshold) : null;

    let whereClause = 'WHERE p.is_active = 1 AND p.stock <= p.min_stock';
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

    // Insert product with schema-compliant fields
    await c.env.DB.prepare(`
      INSERT INTO products (
        id, name, description, sku, barcode, category_id, brand_id, supplier_id, store_id,
        price_cents, cost_price_cents, stock, min_stock, max_stock, unit,
        weight_grams, dimensions, image_url, images, is_active, is_serialized,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
    `).bind(
      productId, name, description, sku, barcode || null, category_id, brand_id, supplier_id,
      'store-1', // Default store_id
      price_cents, cost_price_cents || 0, stock, min_stock, max_stock, unit,
      weight_grams || null,
      dimensions ? JSON.stringify(dimensions) : null,
      image_url || null,
      images ? JSON.stringify(images) : null,
      is_serialized
    ).run();

    // Create initial inventory movement if stock > 0
    if (stock > 0) {
      await c.env.DB.prepare(`
        INSERT INTO inventory_movements (
          id, product_id, transaction_type, quantity, unit_cost_cents, reference_type,
          reference_id, reason, notes, user_id, store_id, product_name, product_sku, created_at
        ) VALUES (?, ?, 'in', ?, ?, 'initial_stock', ?, 'Initial stock', 'Initial stock entry', ?, ?, ?, ?, datetime('now'))
      `).bind(
        `mov_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        productId, stock, cost_price_cents || 0, productId, user.id, 'store-1', name, sku
      ).run().catch(() => {});
    }

    // Get the created product with relations
    const createdProduct = await c.env.DB.prepare(`
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
      message: 'Failed to create product'
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

    // Update product
    await c.env.DB.prepare(`
      UPDATE products
      SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        sku = COALESCE(?, sku),
        barcode = COALESCE(?, barcode),
        category_id = COALESCE(?, category_id),
        brand_id = COALESCE(?, brand_id),
        supplier_id = COALESCE(?, supplier_id),
        price_cents = COALESCE(?, price_cents),
        cost_price_cents = COALESCE(?, cost_price_cents),
        min_stock = COALESCE(?, min_stock),
        max_stock = COALESCE(?, max_stock),
        unit = COALESCE(?, unit),
        weight_grams = COALESCE(?, weight_grams),
        dimensions = COALESCE(?, dimensions),
        image_url = COALESCE(?, image_url),
        images = COALESCE(?, images),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name, description, sku, barcode, category_id, brand_id, supplier_id,
      price_cents, cost_price_cents, min_stock, max_stock, unit,
      weight_grams,
      dimensions ? JSON.stringify(dimensions) : null,
      image_url,
      images ? JSON.stringify(images) : null,
      id
    ).run();

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