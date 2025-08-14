import { Hono } from 'hono';
import { Env, ApiResponse, Product, ProductResponse, PaginatedResult } from '../types';
import { authenticate, authorize, getUser, storeAccess } from '../middleware/auth';
import { validate, validateQuery, getValidated, getValidatedQuery } from '../middleware/validate';
import { productCreateSchema, productUpdateSchema, productQuerySchema } from '../schemas';
import { CacheManager, CacheKeys, CacheConfigs } from '../utils/cache';
import { RealtimeEventBroadcaster } from './websocket';

// Products routes
const app = new Hono<{ Bindings: Env }>();

// Initialize products and categories tables
async function initializeProductTables(env: Env) {
  try {
    // Create categories table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        parent_id INTEGER,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
        deleted_at DATETIME,
        FOREIGN KEY (parent_id) REFERENCES categories(id)
      )
    `).run();

    // Create products table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT NOT NULL UNIQUE,
        barcode TEXT UNIQUE,
        category_id INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
        tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        stock_alert_threshold INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        image_url TEXT,
        created_at DATETIME NOT NULL DEFAULT (datetime('now')),
        updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
        deleted_at DATETIME,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `).run();

    console.log('Products and categories tables initialized');
  } catch (error) {
    console.error('Error initializing product tables:', error);
    throw error;
  }
}

// Initialize essential data - production ready
async function initializeEssentialData(env: Env) {
  try {
    // Check if categories exist
    const categoryCount = await env.DB.prepare('SELECT COUNT(*) as count FROM categories').first<{ count: number }>();

    if (!categoryCount || categoryCount.count === 0) {
      console.log('Creating essential categories...');

      // Create minimal essential categories only
      await env.DB.prepare(`
        INSERT INTO categories (name, description, is_active)
        VALUES (?, ?, ?)
      `).bind('General', 'General products', 1).run();

      console.log('Essential categories created');
    }

    // Products will be added through the admin interface
    console.log('Product structure ready for real data entry');
  } catch (error) {
    console.error('Error initializing essential data:', error);
    throw error;
  }
}

// Test endpoint
app.get('/test', async (c) => {
  return c.json({
    success: true,
    message: 'Products endpoint is working',
    data: null
  });
});

// Public endpoint to initialize tables (no auth required)
app.get('/init-tables', async (c) => {
  try {
    await initializeProductTables(c.env);
    await initializeEssentialData(c.env);

    return c.json({
      success: true,
      data: null,
      message: 'Product tables initialized with essential data'
    });
  } catch (error) {
    console.error('Init product tables error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Init error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Debug endpoint to check query params
app.get('/debug-query', authenticate, async (c) => {
  try {
    const queryParams = c.req.query();
    console.log('Raw query params:', queryParams);

    return c.json({
      success: true,
      data: {
        rawParams: queryParams,
        parsedParams: {
          page: parseInt(queryParams.page || '1'),
          limit: parseInt(queryParams.limit || '10'),
          search: queryParams.search || '',
          category_id: queryParams.category_id ? parseInt(queryParams.category_id) : undefined,
          is_active: queryParams.is_active ? queryParams.is_active === 'true' : undefined,
          low_stock: queryParams.low_stock ? queryParams.low_stock === 'true' : undefined
        }
      },
      message: 'Query params debug'
    });
  } catch (error) {
    console.error('Debug query error:', error);
    return c.json({
      success: false,
      data: null,
      message: 'Debug error: ' + (error instanceof Error ? error.message : String(error))
    }, 500);
  }
});

// Lấy danh sách sản phẩm (có phân trang, lọc, tìm kiếm)
app.get('/', validateQuery(productQuerySchema), async (c) => {
  try {
    // Ensure tables exist
    await initializeProductTables(c.env);

    // Lấy query params đã validate
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'name',
      sortDirection = 'asc',
      category_id,
      low_stock,
      is_active
    } = getValidatedQuery<{
      page: number;
      limit: number;
      search: string;
      sortBy: string;
      sortDirection: 'asc' | 'desc';
      category_id?: number;
      low_stock?: boolean;
      is_active?: boolean;
    }>(c);
    
    // Tạo cache key
    let cacheKey = `products:list:${page}_${limit}_${search}_${sortBy}_${sortDirection}_${category_id || ''}_${low_stock || ''}_${is_active === undefined ? '' : is_active}`;
    const cache = CacheManager.getInstance();

    // Lấy dữ liệu từ cache hoặc database
    const result = await cache.getOrSet(c.env, cacheKey, async () => {
      // Tạo query base
      let query = `
        SELECT
          p.id, p.name, p.description, p.sku, p.barcode,
          p.category_id, c.name as category_name,
          p.price, p.cost_price, p.tax_rate,
          p.stock_quantity, p.stock_alert_threshold,
          p.is_active, p.image_url, p.created_at, p.updated_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
      `;
      
      // Tạo mảng params cho prepared statement
      const params: any[] = [];
      
      // Base count query
      let countQueryStr = `
        SELECT COUNT(*) as total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1
      `;
      
      // Thêm điều kiện tìm kiếm
      if (search) {
        query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
        
        // Cập nhật count query
        countQueryStr += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
      }
      
      // Thêm điều kiện lọc theo category
      if (category_id) {
        query += ` AND p.category_id = ?`;
        params.push(category_id);
        
        // Cập nhật count query
        countQueryStr += ` AND p.category_id = ?`;
      }
      
      // Thêm điều kiện lọc theo active status
      if (is_active !== undefined) {
        query += ` AND p.is_active = ?`;
        params.push(is_active ? 1 : 0);
        
        // Cập nhật count query
        countQueryStr += ` AND p.is_active = ?`;
      }
      
      // Thêm điều kiện lọc theo low stock
      if (low_stock) {
        query += ` AND p.stock_quantity <= p.stock_alert_threshold`;
        
        // Cập nhật count query
        countQueryStr += ` AND p.stock_quantity <= p.stock_alert_threshold`;
      }
      
      // Thêm sắp xếp
      query += ` ORDER BY p.${sortBy} ${sortDirection}`;
      
      // Thêm phân trang
      const offset = (page - 1) * limit;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      // Tạo bản sao params để sử dụng cho count query (không bao gồm LIMIT và OFFSET)
      const countParams = params.slice(0, params.length - 2);
      
      // Thực hiện query để lấy tổng số sản phẩm
      const countResult = await c.env.DB.prepare(countQueryStr).bind(...countParams).first<{ total: number }>();
      const total = countResult?.total || 0;
      
      // Thực hiện query để lấy danh sách sản phẩm
      const productsResult = await c.env.DB.prepare(query).bind(...params).all();
      const products = productsResult.results as any[];
      
      // Chuyển đổi kết quả thành định dạng response
      const formattedProducts: ProductResponse[] = products.map(p => ({
        id: p.id as number,
        name: p.name as string,
        description: p.description as string | null,
        sku: p.sku as string,
        barcode: p.barcode as string | null,
        categoryId: p.category_id as number,
        categoryName: p.category_name as string,
        price: p.price as number,
        costPrice: p.cost_price as number,
        taxRate: p.tax_rate as number,
        stockQuantity: p.stock_quantity as number,
        stockAlertThreshold: p.stock_alert_threshold as number,
        isActive: Boolean(p.is_active),
        imageUrl: p.image_url as string | null,
        createdAt: p.created_at as string,
        updatedAt: p.updated_at as string
      }));
      
      // Trả về kết quả phân trang
      return {
        data: formattedProducts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    }, { ttl: 60 * 5, tags: ['products'] }); // Cache trong 5 phút
    
    return c.json<ApiResponse<PaginatedResult<ProductResponse>>>({
      success: true,
      data: result,
      message: 'Lấy danh sách sản phẩm thành công'
    });
  } catch (error) {
    console.error('Get products error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi khi lấy danh sách sản phẩm'
    }, 500);
  }
});

// Lấy thông tin một sản phẩm - temporarily without auth for debugging
app.get('/:id', async (c) => {
  try {
    const productId = parseInt(c.req.param('id'));
    
    if (isNaN(productId)) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'ID sản phẩm không hợp lệ'
      }, 400);
    }
    
    // Tạo cache key
    const cacheKey = `products:detail:${productId}`;
    const cache = CacheManager.getInstance();

    // Lấy dữ liệu từ cache hoặc database
    const product = await cache.getOrSet(c.env, cacheKey, async () => {
      const result = await c.env.DB.prepare(`
        SELECT 
          p.id, p.name, p.description, p.sku, p.barcode, 
          p.category_id, c.name as category_name,
          p.price, p.cost_price, p.tax_rate, 
          p.stock_quantity, p.stock_alert_threshold, 
          p.is_active, p.image_url, p.created_at, p.updated_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ? AND p.is_active = 1
      `).bind(productId).first();
      
      if (!result) return null;
      
      return {
        id: result.id as number,
        name: result.name as string,
        description: result.description as string | null,
        sku: result.sku as string,
        barcode: result.barcode as string | null,
        categoryId: result.category_id as number,
        categoryName: result.category_name as string,
        price: result.price as number,
        costPrice: result.cost_price as number,
        taxRate: result.tax_rate as number,
        stockQuantity: result.stock_quantity as number,
        stockAlertThreshold: result.stock_alert_threshold as number,
        isActive: Boolean(result.is_active),
        imageUrl: result.image_url as string | null,
        createdAt: result.created_at as string,
        updatedAt: result.updated_at as string
      };
    }, { ttl: 60 * 5, tags: ['products'] }); // Cache trong 5 phút
    
    if (!product) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Sản phẩm không tồn tại hoặc đã bị xóa'
      }, 404);
    }
    
    return c.json<ApiResponse<ProductResponse>>({
      success: true,
      data: product,
      message: 'Lấy thông tin sản phẩm thành công'
    });
  } catch (error) {
    console.error('Get product error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi khi lấy thông tin sản phẩm'
    }, 500);
  }
});

// Tạo sản phẩm mới
app.post('/', authenticate, validate(productCreateSchema), async (c) => {
  try {
    const productData = getValidated<Product>(c);
    const user = c.get('jwtPayload');
    
    // Kiểm tra SKU đã tồn tại chưa
    const existingSku = await c.env.DB.prepare(`
      SELECT id FROM products WHERE sku = ?
    `).bind(productData.sku).first();
    
    if (existingSku) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Mã SKU đã tồn tại'
      }, 400);
    }
    
    // Kiểm tra barcode đã tồn tại chưa (nếu có và không rỗng)
    if (productData.barcode && productData.barcode.trim() !== '') {
      const existingBarcode = await c.env.DB.prepare(`
        SELECT id FROM products WHERE barcode = ? AND barcode IS NOT NULL AND barcode != ''
      `).bind(productData.barcode.trim()).first();

      if (existingBarcode) {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Mã barcode đã tồn tại'
        }, 400);
      }
    }

    // Kiểm tra category_id có tồn tại không
    const categoryExists = await c.env.DB.prepare(`
      SELECT id FROM categories WHERE id = ?
    `).bind(productData.category_id).first();

    if (!categoryExists) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Danh mục không tồn tại'
      }, 400);
    }
    
    // Thêm sản phẩm mới
    const result = await c.env.DB.prepare(`
      INSERT INTO products (
        name, description, sku, barcode, category_id, 
        price, cost_price, tax_rate, stock_quantity, stock_alert_threshold, 
        is_active, image_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      productData.name,
      productData.description || null,
      productData.sku,
      (productData.barcode && productData.barcode.trim() !== '') ? productData.barcode.trim() : null,
      productData.category_id,
      productData.price,
      productData.cost_price,
      productData.tax_rate,
      productData.stock_quantity,
      productData.stock_alert_threshold,
      productData.is_active === false ? 0 : 1, // Default to active
      (productData.image_url && productData.image_url.trim() !== '') ? productData.image_url.trim() : null
    ).run();
    
    if (!result.success) {
      throw new Error('Failed to insert product');
    }
    
    // Lấy ID sản phẩm mới tạo
    const newProductId = result.meta?.last_row_id;
    
    // Ghi log hoạt động - temporarily disabled due to missing table
    // await c.env.DB.prepare(`
    //   INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
    //   VALUES (?, 'create', 'product', ?, ?, datetime('now'))
    // `).bind(
    //   user.id,
    //   newProductId,
    //   JSON.stringify({
    //     name: productData.name,
    //     sku: productData.sku,
    //     category_id: productData.category_id
    //   })
    // ).run();
    
    // Xóa cache danh sách sản phẩm
    const cache = CacheManager.getInstance();
    await cache.clearByTags(c.env, ['products']);
    
    // Lấy thông tin sản phẩm vừa tạo
    const newProduct = await c.env.DB.prepare(`
      SELECT 
        p.id, p.name, p.description, p.sku, p.barcode, 
        p.category_id, c.name as category_name,
        p.price, p.cost_price, p.tax_rate, 
        p.stock_quantity, p.stock_alert_threshold, 
        p.is_active, p.image_url, p.created_at, p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).bind(newProductId).first();
    
    if (!newProduct) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Không thể tạo sản phẩm'
      }, 500);
    }
    
    // Format response
    const productResponse: ProductResponse = {
      id: newProduct.id as number,
      name: newProduct.name as string,
      description: newProduct.description as string | null,
      sku: newProduct.sku as string,
      barcode: newProduct.barcode as string | null,
      categoryId: newProduct.category_id as number,
      categoryName: newProduct.category_name as string,
      price: newProduct.price as number,
      costPrice: newProduct.cost_price as number,
      taxRate: newProduct.tax_rate as number,
      stockQuantity: newProduct.stock_quantity as number,
      stockAlertThreshold: newProduct.stock_alert_threshold as number,
      isActive: Boolean(newProduct.is_active),
      imageUrl: newProduct.image_url as string | null,
      createdAt: newProduct.created_at as string,
      updatedAt: newProduct.updated_at as string
    };
    
    return c.json<ApiResponse<ProductResponse>>({
      success: true,
      data: productResponse,
      message: 'Tạo sản phẩm mới thành công'
    }, 201);
  } catch (error) {
    console.error('Create product error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi khi tạo sản phẩm mới'
    }, 500);
  }
});

// Cập nhật sản phẩm
app.put('/:id', authenticate, validate(productUpdateSchema), async (c) => {
  try {
    const productId = parseInt(c.req.param('id'));
    const productData = getValidated<Product>(c);
    const user = c.get('jwtPayload');


    
    if (isNaN(productId)) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'ID sản phẩm không hợp lệ'
      }, 400);
    }
    
    // Kiểm tra sản phẩm có tồn tại không
    const existingProduct = await c.env.DB.prepare(`
      SELECT id FROM products WHERE id = ?
    `).bind(productId).first();
    
    if (!existingProduct) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Sản phẩm không tồn tại hoặc đã bị xóa'
      }, 404);
    }
    
    // Kiểm tra SKU đã tồn tại chưa (nếu đang cập nhật SKU)
    if (productData.sku) {
      const existingSku = await c.env.DB.prepare(`
        SELECT id FROM products WHERE sku = ? AND id != ?
      `).bind(productData.sku, productId).first();
      
      if (existingSku) {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Mã SKU đã tồn tại'
        }, 400);
      }
    }
    
    // Kiểm tra barcode đã tồn tại chưa (nếu đang cập nhật barcode)
    if (productData.barcode) {
      const existingBarcode = await c.env.DB.prepare(`
        SELECT id FROM products WHERE barcode = ? AND id != ?
      `).bind(productData.barcode, productId).first();
      
      if (existingBarcode) {
        return c.json<ApiResponse<null>>({
          success: false,
          data: null,
          message: 'Mã barcode đã tồn tại'
        }, 400);
      }
    }
    
    // Tạo câu query động dựa trên các field được cập nhật
    let queryParts = [];
    const queryParams = [];
    
    if (productData.name !== undefined) {
      queryParts.push('name = ?');
      queryParams.push(productData.name);
    }
    
    if (productData.description !== undefined) {
      queryParts.push('description = ?');
      queryParams.push(productData.description);
    }
    
    if (productData.sku !== undefined) {
      queryParts.push('sku = ?');
      queryParams.push(productData.sku);
    }
    
    if (productData.barcode !== undefined) {
      queryParts.push('barcode = ?');
      queryParams.push(productData.barcode);
    }
    
    if (productData.category_id !== undefined) {
      queryParts.push('category_id = ?');
      queryParams.push(productData.category_id);
    }
    
    if (productData.price !== undefined) {
      queryParts.push('price = ?');
      queryParams.push(productData.price);
    }
    
    if (productData.cost_price !== undefined) {
      queryParts.push('cost_price = ?');
      queryParams.push(productData.cost_price);
    }
    
    if (productData.tax_rate !== undefined) {
      queryParts.push('tax_rate = ?');
      queryParams.push(productData.tax_rate);
    }
    
    if (productData.stock_quantity !== undefined) {
      queryParts.push('stock_quantity = ?');
      queryParams.push(productData.stock_quantity);
    }
    
    if (productData.stock_alert_threshold !== undefined) {
      queryParts.push('stock_alert_threshold = ?');
      queryParams.push(productData.stock_alert_threshold);
    }
    
    if (productData.is_active !== undefined) {
      queryParts.push('is_active = ?');
      queryParams.push(productData.is_active ? 1 : 0);
    }
    
    if (productData.image_url !== undefined) {
      queryParts.push('image_url = ?');
      queryParams.push(productData.image_url);
    }
    
    // Thêm updated_at
    queryParts.push('updated_at = datetime(\'now\')');
    
    // Nếu không có field nào được cập nhật
    if (queryParts.length === 1) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Không có thông tin nào được cập nhật'
      }, 400);
    }
    
    // Tạo query và thực hiện cập nhật
    const updateQuery = `UPDATE products SET ${queryParts.join(', ')} WHERE id = ?`;
    queryParams.push(productId);
    
    const result = await c.env.DB.prepare(updateQuery).bind(...queryParams).run();
    
    if (!result.success) {
      throw new Error('Failed to update product');
    }
    
    // Ghi log hoạt động - temporarily disabled due to missing table
    // await c.env.DB.prepare(`
    //   INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
    //   VALUES (?, 'update', 'product', ?, ?, datetime('now'))
    // `).bind(
    //   user.id,
    //   productId,
    //   JSON.stringify(productData)
    // ).run();
    
    // Xóa cache sản phẩm này và danh sách sản phẩm
    const cache = CacheManager.getInstance();
    await cache.delete(c.env, `products:detail:${productId}`);
    await cache.clearByTags(c.env, ['products']);
    
    // Lấy thông tin sản phẩm sau khi cập nhật
    const updatedProduct = await c.env.DB.prepare(`
      SELECT 
        p.id, p.name, p.description, p.sku, p.barcode, 
        p.category_id, c.name as category_name,
        p.price, p.cost_price, p.tax_rate, 
        p.stock_quantity, p.stock_alert_threshold, 
        p.is_active, p.image_url, p.created_at, p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).bind(productId).first();
    
    if (!updatedProduct) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Không thể cập nhật sản phẩm'
      }, 500);
    }
    
    // Format response
    const productResponse: ProductResponse = {
      id: updatedProduct.id as number,
      name: updatedProduct.name as string,
      description: updatedProduct.description as string | null,
      sku: updatedProduct.sku as string,
      barcode: updatedProduct.barcode as string | null,
      categoryId: updatedProduct.category_id as number,
      categoryName: updatedProduct.category_name as string,
      price: updatedProduct.price as number,
      costPrice: updatedProduct.cost_price as number,
      taxRate: updatedProduct.tax_rate as number,
      stockQuantity: updatedProduct.stock_quantity as number,
      stockAlertThreshold: updatedProduct.stock_alert_threshold as number,
      isActive: Boolean(updatedProduct.is_active),
      imageUrl: updatedProduct.image_url as string | null,
      createdAt: updatedProduct.created_at as string,
      updatedAt: updatedProduct.updated_at as string
    };
    
    return c.json<ApiResponse<ProductResponse>>({
      success: true,
      data: productResponse,
      message: 'Cập nhật sản phẩm thành công'
    });
  } catch (error) {
    console.error('Update product error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: `Lỗi khi cập nhật sản phẩm: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, 500);
  }
});

// Xóa sản phẩm (soft delete)
app.delete('/:id', authenticate, async (c) => {
  try {
    const productId = parseInt(c.req.param('id'));
    const user = c.get('jwtPayload');
    
    if (isNaN(productId)) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'ID sản phẩm không hợp lệ'
      }, 400);
    }
    
    // Kiểm tra sản phẩm có tồn tại không
    const existingProduct = await c.env.DB.prepare(`
      SELECT id, name FROM products WHERE id = ?
    `).bind(productId).first();
    
    if (!existingProduct) {
      return c.json<ApiResponse<null>>({
        success: false,
        data: null,
        message: 'Sản phẩm không tồn tại hoặc đã bị xóa'
      }, 404);
    }
    
    // Kiểm tra sản phẩm có được sử dụng trong sale_items không
    const usedInSales = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?
    `).bind(productId).first<{ count: number }>();
    
    // Nếu sản phẩm đã được sử dụng trong sale_items, chỉ soft delete
    const result = await c.env.DB.prepare(`
      UPDATE products SET is_active = 0 WHERE id = ?
    `).bind(productId).run();
    
    if (!result.success) {
      throw new Error('Failed to delete product');
    }
    
    // Ghi log hoạt động - temporarily disabled due to missing table
    // await c.env.DB.prepare(`
    //   INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
    //   VALUES (?, 'delete', 'product', ?, ?, datetime('now'))
    // `).bind(
    //   user.id,
    //   productId,
    //   JSON.stringify({
    //     name: existingProduct.name,
    //     permanent: false
    //   })
    // ).run();
    
    // Xóa cache sản phẩm này và danh sách sản phẩm
    const cache = CacheManager.getInstance();
    await cache.delete(c.env, `products:detail:${productId}`);
    await cache.clearByTags(c.env, ['products']);
    
    return c.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: usedInSales && usedInSales.count > 0
        ? 'Sản phẩm đã được sử dụng trong đơn hàng, đã chuyển sang trạng thái không hoạt động'
        : 'Xóa sản phẩm thành công'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    return c.json<ApiResponse<null>>({
      success: false,
      data: null,
      message: 'Lỗi khi xóa sản phẩm'
    }, 500);
  }
});

export default app; 