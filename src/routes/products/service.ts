import { Env } from '../../types';
import { Product, ProductCreateData, ProductUpdateData, ProductQueryParams, ProductStats, ProductAnalytics } from './types';
import { ProductDatabase } from './database';
import { CacheManager, CacheKeys } from '../../utils/cache';

export class ProductService {
  private db: ProductDatabase;
  private cache: CacheManager;

  constructor(private env: Env) {
    this.db = new ProductDatabase(env);
    this.cache = new CacheManager(env);
  }

  // Initialize service
  async initialize(): Promise<void> {
    await this.db.initializeTables();
    await this.db.initializeEssentialData();
  }

  // Get all products with filtering and pagination
  async getProducts(params: ProductQueryParams): Promise<{ products: Product[]; total: number; stats?: ProductStats }> {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category_id,
        supplier_id,
        brand,
        is_active,
        is_featured,
        in_stock_only,
        low_stock_only,
        price_min,
        price_max,
        sort_by = 'created_at',
        sort_order = 'desc',
        tags
      } = params;

      const offset = (page - 1) * limit;

      // Build WHERE clause
      const conditions: string[] = ['p.deleted_at IS NULL'];
      const bindings: any[] = [];

      if (search) {
        conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ? OR p.description LIKE ?)');
        const searchTerm = `%${search}%`;
        bindings.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (category_id) {
        conditions.push('p.category_id = ?');
        bindings.push(category_id);
      }

      if (supplier_id) {
        conditions.push('p.supplier_id = ?');
        bindings.push(supplier_id);
      }

      if (brand) {
        conditions.push('p.brand = ?');
        bindings.push(brand);
      }

      if (is_active !== undefined) {
        conditions.push('p.is_active = ?');
        bindings.push(is_active ? 1 : 0);
      }

      if (is_featured !== undefined) {
        conditions.push('p.is_featured = ?');
        bindings.push(is_featured ? 1 : 0);
      }

      if (in_stock_only) {
        conditions.push('p.stock_quantity > 0');
      }

      if (low_stock_only) {
        conditions.push('p.stock_quantity <= p.stock_alert_threshold AND p.stock_quantity > 0');
      }

      if (price_min !== undefined) {
        conditions.push('p.price >= ?');
        bindings.push(price_min);
      }

      if (price_max !== undefined) {
        conditions.push('p.price <= ?');
        bindings.push(price_max);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Build ORDER BY clause
      const validSortFields = ['name', 'price', 'stock_quantity', 'created_at', 'updated_at', 'total_sold'];
      const sortField = validSortFields.includes(sort_by) ? sort_by : 'created_at';
      const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

      // Get products with category information
      const query = `
        SELECT 
          p.*,
          c.name as category_name,
          ROUND((p.price - p.cost_price) / p.cost_price * 100, 2) as profit_margin
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereClause}
        ORDER BY p.${sortField} ${sortDirection}
        LIMIT ? OFFSET ?
      `;

      const products = await this.env.DB.prepare(query)
        .bind(...bindings, limit, offset)
        .all<Product>();

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM products p
        ${whereClause}
      `;

      const countResult = await this.env.DB.prepare(countQuery)
        .bind(...bindings)
        .first<{ total: number }>();

      const total = countResult?.total || 0;

      // Get stats if requested (first page only)
      let stats: ProductStats | undefined;
      if (page === 1) {
        stats = await this.getStats();
      }

      return {
        products: products.results || [],
        total,
        stats
      };
    } catch (error) {
      console.error('Error getting products:', error);
      throw new Error('Failed to get products');
    }
  }

  // Get product by ID
  async getProductById(id: number): Promise<Product | null> {
    try {
      console.log('🔍 Getting product by ID:', id);

      // Skip cache for debugging
      // const cacheKey = CacheKeys.product(id);
      // const cached = await this.cache.get<Product>(cacheKey);
      // if (cached) return cached;

      console.log('📊 Executing database query...');
      const product = await this.env.DB.prepare(`
        SELECT
          p.id,
          p.name,
          p.sku,
          p.barcode,
          p.category_id,
          p.price,
          p.cost_price,
          p.tax_rate,
          p.stock_quantity,
          p.min_stock_level,
          p.is_active,
          p.image_url,
          p.brand,
          p.description,
          p.discount_eligible,
          p.created_at,
          p.updated_at,
          c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ? AND (p.deleted_at IS NULL OR p.deleted_at = '')
      `).bind(id).first<Product>();

      console.log('📦 Database result:', product);

      // Skip cache for debugging
      // if (product) {
      //   await this.cache.set(cacheKey, product, 300); // Cache for 5 minutes
      // }

      return product || null;
    } catch (error) {
      console.error('❌ Error getting product by ID:', error);
      throw new Error(`Failed to get product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get product by SKU
  async getProductBySku(sku: string): Promise<Product | null> {
    try {
      const product = await this.env.DB.prepare(`
        SELECT 
          p.*,
          c.name as category_name,
          s.name as supplier_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.sku = ? AND p.deleted_at IS NULL
      `).bind(sku).first<Product>();

      return product || null;
    } catch (error) {
      console.error('Error getting product by SKU:', error);
      throw new Error('Failed to get product');
    }
  }

  // Get product by barcode
  async getProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      const product = await this.env.DB.prepare(`
        SELECT 
          p.*,
          c.name as category_name,
          s.name as supplier_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.barcode = ? AND p.deleted_at IS NULL
      `).bind(barcode).first<Product>();

      return product || null;
    } catch (error) {
      console.error('Error getting product by barcode:', error);
      throw new Error('Failed to get product');
    }
  }

  // Create new product
  async createProduct(data: ProductCreateData, userId: number): Promise<Product> {
    try {
      // Check if SKU already exists
      const existingSku = await this.getProductBySku(data.sku);
      if (existingSku) {
        throw new Error('SKU already exists');
      }

      // Check if barcode already exists (if provided)
      if (data.barcode) {
        const existingBarcode = await this.getProductByBarcode(data.barcode);
        if (existingBarcode) {
          throw new Error('Barcode already exists');
        }
      }

      // Validate category exists
      const category = await this.env.DB.prepare('SELECT id FROM categories WHERE id = ? AND deleted_at IS NULL')
        .bind(data.category_id).first<{ id: number }>();
      
      if (!category) {
        throw new Error('Category not found');
      }

      const result = await this.env.DB.prepare(`
        INSERT INTO products (
          name, description, short_description, sku, barcode, category_id, 
          price, cost_price, wholesale_price, retail_price, tax_rate,
          stock_quantity, stock_alert_threshold, min_stock_level, max_stock_level, reorder_point,
          unit, weight, dimensions, brand, model, supplier_id,
          warranty_period, warranty_type, is_active, is_featured, is_digital,
          track_inventory, allow_backorder, image_url, images, tags, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.name,
        data.description,
        data.description?.substring(0, 200), // short_description
        data.sku,
        data.barcode,
        data.category_id,
        data.price,
        data.cost_price,
        data.wholesale_price,
        data.retail_price,
        data.tax_rate || 0,
        data.stock_quantity,
        data.stock_alert_threshold,
        data.min_stock_level,
        data.max_stock_level,
        data.reorder_point,
        data.unit || 'pcs',
        data.weight,
        data.dimensions,
        data.brand,
        data.model,
        data.supplier_id,
        data.warranty_period,
        data.warranty_type,
        data.is_active !== false ? 1 : 0,
        data.is_featured ? 1 : 0,
        data.is_digital ? 1 : 0,
        data.track_inventory !== false ? 1 : 0,
        data.allow_backorder ? 1 : 0,
        data.image_url,
        data.images ? JSON.stringify(data.images) : null,
        data.tags ? JSON.stringify(data.tags) : null,
        userId
      ).run();

      const productId = result.meta.last_row_id as number;

      // Record initial stock movement if stock > 0
      if (data.stock_quantity > 0) {
        await this.env.DB.prepare(`
          INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, notes, created_by)
          VALUES (?, 'in', ?, 'initial', 'Initial stock', ?)
        `).bind(productId, data.stock_quantity, userId).run();
      }

      // Clear cache
      await this.cache.delete(CacheKeys.productsList());

      const newProduct = await this.getProductById(productId);
      if (!newProduct) {
        throw new Error('Failed to retrieve created product');
      }

      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  // Update product
  async updateProduct(id: number, data: ProductUpdateData, userId: number): Promise<Product> {
    try {
      const existingProduct = await this.getProductById(id);
      if (!existingProduct) {
        throw new Error('Product not found');
      }

      // Check SKU uniqueness if changed
      if (data.sku && data.sku !== existingProduct.sku) {
        const existingSku = await this.getProductBySku(data.sku);
        if (existingSku) {
          throw new Error('SKU already exists');
        }
      }

      // Check barcode uniqueness if changed
      if (data.barcode && data.barcode !== existingProduct.barcode) {
        const existingBarcode = await this.getProductByBarcode(data.barcode);
        if (existingBarcode) {
          throw new Error('Barcode already exists');
        }
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const bindings: any[] = [];

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== 'updated_by') {
          if (key === 'images' || key === 'tags') {
            updateFields.push(`${key} = ?`);
            bindings.push(value ? JSON.stringify(value) : null);
          } else if (typeof value === 'boolean') {
            updateFields.push(`${key} = ?`);
            bindings.push(value ? 1 : 0);
          } else {
            updateFields.push(`${key} = ?`);
            bindings.push(value);
          }
        }
      });

      updateFields.push('updated_by = ?', 'updated_at = datetime(\'now\')');
      bindings.push(userId, id);

      await this.env.DB.prepare(`
        UPDATE products 
        SET ${updateFields.join(', ')}
        WHERE id = ? AND deleted_at IS NULL
      `).bind(...bindings).run();

      // Clear cache
      await this.cache.delete(CacheKeys.product(id));
      await this.cache.delete(CacheKeys.productsList());

      const updatedProduct = await this.getProductById(id);
      if (!updatedProduct) {
        throw new Error('Failed to retrieve updated product');
      }

      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // Delete product (soft delete)
  async deleteProduct(id: number, userId: number): Promise<void> {
    try {
      const product = await this.getProductById(id);
      if (!product) {
        throw new Error('Product not found');
      }

      await this.env.DB.prepare(`
        UPDATE products 
        SET deleted_at = datetime('now'), updated_by = ?
        WHERE id = ? AND deleted_at IS NULL
      `).bind(userId, id).run();

      // Clear cache
      await this.cache.delete(CacheKeys.product(id));
      await this.cache.delete(CacheKeys.productsList());
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Update stock quantity
  async updateStock(productId: number, quantity: number, movementType: 'in' | 'out' | 'adjustment', referenceType?: string, referenceId?: number, notes?: string, userId?: number): Promise<void> {
    try {
      const product = await this.getProductById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      let newQuantity: number;
      if (movementType === 'in') {
        newQuantity = product.stock_quantity + quantity;
      } else if (movementType === 'out') {
        newQuantity = Math.max(0, product.stock_quantity - quantity);
      } else {
        newQuantity = quantity; // adjustment sets absolute quantity
      }

      // Update product stock
      await this.env.DB.prepare(`
        UPDATE products 
        SET stock_quantity = ?, updated_at = datetime('now'), last_restocked_date = CASE WHEN ? = 'in' THEN datetime('now') ELSE last_restocked_date END
        WHERE id = ?
      `).bind(newQuantity, movementType, productId).run();

      // Record stock movement
      await this.env.DB.prepare(`
        INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, notes, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(productId, movementType, quantity, referenceType, referenceId, notes, userId).run();

      // Clear cache
      await this.cache.delete(CacheKeys.product(productId));
      await this.cache.delete(CacheKeys.productsList());
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
  }

  // Get product statistics
  async getStats(): Promise<ProductStats> {
    try {
      return await this.db.getStats();
    } catch (error) {
      console.error('Error getting product stats:', error);
      // Return default stats on error
      return {
        total_products: 0,
        active_products: 0,
        inactive_products: 0,
        low_stock_products: 0,
        out_of_stock_products: 0,
        featured_products: 0,
        total_value: 0,
        average_price: 0,
        categories_count: 0,
        brands_count: 0,
        suppliers_count: 0
      };
    }
  }
}
