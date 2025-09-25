import { Hono } from 'hono';
import { Env } from '../../types';
import { authenticate, getUser } from '../../middleware/auth';
import { IdempotencyMiddleware } from '../../middleware/idempotency';
import { withValidation } from '../../middleware/validation';

const app = new Hono<{ Bindings: Env }>();

// Apply authentication middleware to all routes
app.use('*', authenticate);

// GET /api/products - List products with search, filter, pagination
app.get('/', withValidation.list, async (c: any) => {
  try {    // Tables are created via migrations - no runtime DDL needed

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

    let whereClause = 'WHERE (p.is_active = 1 OR (p.is_active IS NULL AND p.isActive = 1))';
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
      whereClause = 'WHERE (p.is_active = 0 OR (p.is_active IS NULL AND p.isActive = 0))';
    }

    if (low_stock === 'true') {
      whereClause += ' AND p.stock <= p.min_stock';
    }

    const allowedSortFields = ['name', 'sku', 'price_cents', 'stock', 'created_at'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'name';
    const sortDirection = sort_order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Use simplified query to avoid JOIN errors with missing tables
    // Handle both schema versions: isActive vs is_active, price vs price_cents
    const query = `
      SELECT
        p.*,
        CASE
          WHEN p.price_cents IS NOT NULL AND p.price_cents > 0 THEN CAST(p.price_cents / 100.0 AS REAL)
          ELSE COALESCE(p.price, 0)
        END as price,
        CASE
          WHEN p.cost_price_cents IS NOT NULL AND p.cost_price_cents > 0 THEN CAST(p.cost_price_cents / 100.0 AS REAL)
          ELSE COALESCE(p.cost, p.cost_price, 0)
        END as cost_price,
        CASE
          WHEN p.stock <= 0 THEN 'out_of_stock'
          WHEN p.stock <= COALESCE(p.min_stock, p.minStock, 0) THEN 'low_stock'
          WHEN p.stock >= COALESCE(p.max_stock, p.maxStock, 999999) THEN 'overstock'
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

// GET /api/products/categories - Get all categories (compatibility route)
app.get('/categories', async (c: any) => {
  try {
    // Tables are created via migrations - no runtime DDL needed

    const { page = '1', limit = '50' } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get categories with basic info - simplified to avoid schema conflicts
    const query = `
      SELECT
        id, name, description, is_active
      FROM categories
      WHERE is_active = 1
      ORDER BY name ASC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM categories
      WHERE is_active = 1
    `;

    const [categoriesResult, countResult] = await Promise.all([
      c.env.DB.prepare(query).bind(parseInt(limit), offset).all(),
      c.env.DB.prepare(countQuery).first()
    ]);

    return c.json({
      success: true,
      data: categoriesResult.results || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult?.total || 0,
        pages: Math.ceil((countResult?.total || 0) / parseInt(limit))
      },
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Products categories error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch categories',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// GET /api/products/search - Search products (must come before /:id)
app.get('/search', async (c: any) => {
  try {
    const { q, limit = '20' } = c.req.query();

    if (!q) {
      return c.json({
        success: false,
        message: 'Search query is required'
      }, 400);
    }

    const products = await c.env.DB.prepare(`
      SELECT
        p.*,
        c.name as category_name,
        CASE
          WHEN p.price_cents IS NOT NULL AND p.price_cents > 0 THEN CAST(p.price_cents / 100.0 AS REAL)
          ELSE COALESCE(p.price, 0)
        END as price,
        CASE
          WHEN p.cost_price_cents IS NOT NULL AND p.cost_price_cents > 0 THEN CAST(p.cost_price_cents / 100.0 AS REAL)
          ELSE COALESCE(p.cost, p.cost_price, 0)
        END as cost_price,
        CASE
          WHEN p.stock <= 0 THEN 'out_of_stock'
          WHEN p.stock <= COALESCE(p.min_stock, p.minStock, 0) THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE (p.is_active = 1 OR (p.is_active IS NULL AND p.isActive = 1))
        AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)
      ORDER BY p.name ASC
      LIMIT ?
    `).bind(`%${q}%`, `%${q}%`, `%${q}%`, parseInt(limit)).all();

    return c.json({
      success: true,
      data: products.results || [],
      pagination: {
        page: 1,
        limit: parseInt(limit),
        total: (products.results || []).length
      }
    });
  } catch (error) {
    console.error('Product search error:', error);
    return c.json({
      success: false,
      message: 'Product search failed'
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

    // Simplified query - only join with categories table that exists
    const product = await c.env.DB.prepare(`
      SELECT
        p.*,
        c.name as category_name,
        CASE
          WHEN p.stock <= 0 THEN 'out_of_stock'
          WHEN p.stock <= COALESCE(p.min_stock, p.minStock, 0) THEN 'low_stock'
          WHEN p.stock >= COALESCE(p.max_stock, p.maxStock, 999999) THEN 'overstock'
          ELSE 'in_stock'
        END as stock_status,
        CASE
          WHEN p.price_cents IS NOT NULL AND p.price_cents > 0 THEN CAST(p.price_cents / 100.0 AS REAL)
          ELSE COALESCE(p.price, 0)
        END as price,
        CASE
          WHEN p.cost_price_cents IS NOT NULL AND p.cost_price_cents > 0 THEN CAST(p.cost_price_cents / 100.0 AS REAL)
          ELSE COALESCE(p.cost, p.cost_price, 0)
        END as cost_price
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).bind(id).first();

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
    console.error('Product detail error:', error);
    return c.json({
      success: false,
      message: 'Failed to fetch product'
    }, 500);
  }
});

// POST /api/products/sample - Create sample products for testing
app.post('/sample', async (c: any) => {
  try {
    const user = getUser(c);
    
    // Sample products data
    const sampleProducts = [
      {
        id: 'prod_sample_001',
        name: 'iPhone 15 Pro Max',
        sku: 'IPH15PM-256GB',
        barcode: '1234567890123',
        description: 'iPhone 15 Pro Max 256GB Titanium',
        price_cents: 35000000, // 350,000 VND
        cost_price_cents: 30000000, // 300,000 VND
        stock: 10,
        min_stock: 2,
        max_stock: 50,
        unit: 'piece',
        category_id: 'cat-electronics',
        brand_id: 'brand-apple',
        supplier_id: 'supplier-apple'
      },
      {
        id: 'prod_sample_002',
        name: 'Samsung Galaxy S24 Ultra',
        sku: 'SGS24U-512GB',
        barcode: '1234567890124',
        description: 'Samsung Galaxy S24 Ultra 512GB',
        price_cents: 28000000, // 280,000 VND
        cost_price_cents: 25000000, // 250,000 VND
        stock: 15,
        min_stock: 3,
        max_stock: 40,
        unit: 'piece',
        category_id: 'cat-electronics',
        brand_id: 'brand-samsung',
        supplier_id: 'supplier-samsung'
      },
      {
        id: 'prod_sample_003',
        name: 'MacBook Pro M3',
        sku: 'MBP-M3-14',
        barcode: '1234567890125',
        description: 'MacBook Pro 14-inch M3 Chip',
        price_cents: 45000000, // 450,000 VND
        cost_price_cents: 40000000, // 400,000 VND
        stock: 5,
        min_stock: 1,
        max_stock: 20,
        unit: 'piece',
        category_id: 'cat-electronics',
        brand_id: 'brand-apple',
        supplier_id: 'supplier-apple'
      },
      {
        id: 'prod_sample_004',
        name: 'AirPods Pro 2',
        sku: 'APP2-GEN2',
        barcode: '1234567890126',
        description: 'AirPods Pro 2nd Generation',
        price_cents: 6500000, // 6,500,000 VND
        cost_price_cents: 5500000, // 5,500,000 VND
        stock: 25,
        min_stock: 5,
        max_stock: 100,
        unit: 'piece',
        category_id: 'cat-electronics',
        brand_id: 'brand-apple',
        supplier_id: 'supplier-apple'
      },
      {
        id: 'prod_sample_005',
        name: 'Sony WH-1000XM5',
        sku: 'SONY-WH1000XM5',
        barcode: '1234567890127',
        description: 'Sony WH-1000XM5 Noise Cancelling Headphones',
        price_cents: 8500000, // 8,500,000 VND
        cost_price_cents: 7000000, // 7,000,000 VND
        stock: 12,
        min_stock: 3,
        max_stock: 30,
        unit: 'piece',
        category_id: 'cat-electronics',
        brand_id: 'brand-sony',
        supplier_id: 'supplier-sony'
      }
    ];

    // Create sample categories if they don't exist
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO categories (id, name, description) VALUES
      ('cat-electronics', 'Điện tử', 'Thiết bị điện tử và phụ kiện'),
      ('cat-clothing', 'Thời trang', 'Quần áo và phụ kiện thời trang'),
      ('cat-food', 'Thực phẩm', 'Thực phẩm và đồ uống')
    `).run();

    // Create sample brands if they don't exist
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO brands (id, name, description) VALUES
      ('brand-apple', 'Apple', 'Apple Inc.'),
      ('brand-samsung', 'Samsung', 'Samsung Electronics'),
      ('brand-sony', 'Sony', 'Sony Corporation')
    `).run();

    // Create sample suppliers if they don't exist
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO suppliers (id, name) VALUES
      ('supplier-apple', 'Apple Vietnam'),
      ('supplier-samsung', 'Samsung Vietnam'),
      ('supplier-sony', 'Sony Vietnam')
    `).run();

    const createdProducts = [];

    // Insert sample products
    for (const product of sampleProducts) {
      try {
        await c.env.DB.prepare(`
          INSERT OR REPLACE INTO products (
            id, name, description, sku, barcode, category_id, brand_id, supplier_id,
            price_cents, cost_price_cents, stock, min_stock, max_stock, unit, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          product.id, product.name, product.description, product.sku, product.barcode,
          product.category_id, product.brand_id, product.supplier_id,
          product.price_cents, product.cost_price_cents, product.stock,
          product.min_stock, product.max_stock, product.unit, 1
        ).run();

        createdProducts.push(product);
      } catch (error) {
        console.error(`Failed to create product ${product.name}:`, error);
      }
    }

    return c.json({
      success: true,
      data: {
        created_count: createdProducts.length,
        products: createdProducts
      },
      message: `Successfully created ${createdProducts.length} sample products`
    }, 201);
  } catch (error) {
    console.error('Sample products creation error:', error);
    return c.json({
      success: false,
      message: 'Failed to create sample products',
      error: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
app.post('/', IdempotencyMiddleware.api, withValidation.createProduct, async (c: any) => {
  try {
    const user = getUser(c);
    const data = await c.req.json();

    const {
      name, description, sku, barcode, category_id, brand_id, supplier_id,
      price_cents, cost_price_cents, price, cost_price, cost,
      stock = 0, min_stock = 0, max_stock = 100, unit = 'piece',
      weight_grams, dimensions, image_url, images, is_serialized = 0
    } = data;

    // Support both price formats: price_cents or price
    const finalPriceCents = price_cents || (price ? Math.round(price * 100) : 0);
    const finalCostPriceCents = cost_price_cents || (cost_price ? Math.round(cost_price * 100) : 0) || (cost ? Math.round(cost * 100) : 0);

    if (!name || !sku || (finalPriceCents === undefined && price === undefined && price_cents === undefined)) {
      return c.json({
        success: false,
        message: 'Name, SKU, and price are required'
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

    // Insert product using dual schema support
    await c.env.DB.prepare(`
      INSERT INTO products (
        id, name, description, sku, barcode, category_id, supplier_id,
        price, price_cents, cost, cost_price, cost_price_cents, stock, min_stock, max_stock, unit, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      productId, name, description || null, sku, barcode || null, category_id || null, supplier_id || null,
      Math.round(finalPriceCents / 100), finalPriceCents,
      Math.round(finalCostPriceCents / 100), Math.round(finalCostPriceCents / 100), finalCostPriceCents,
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
      price_cents, cost_price_cents, price, cost_price, cost, min_stock, max_stock, unit,
      weight_grams, dimensions, image_url, images
    } = data;

    // Support both price formats
    const finalPriceCents = price_cents || (price ? Math.round(price * 100) : undefined);
    const finalCostPriceCents = cost_price_cents || (cost_price ? Math.round(cost_price * 100) : undefined) || (cost ? Math.round(cost * 100) : undefined);

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
    if (finalPriceCents !== undefined) {
      updateFields.push('price_cents = ?');
      updateValues.push(finalPriceCents);
    }
    if (finalCostPriceCents !== undefined) {
      updateFields.push('cost_price_cents = ?');
      updateValues.push(finalCostPriceCents);
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
      updateFields.push('unit = ?');
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

    // Get updated product - simplified query without non-existent tables
    const updatedProduct = await c.env.DB.prepare(`
      SELECT
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
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