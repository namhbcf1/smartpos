import { Context } from 'hono';
import { Env, ApiResponse } from '../../types';
import { ProductService } from './service';
import { ProductQueryParams, ProductCreateData, ProductUpdateData, ProductResponse } from './types';
import { getUser } from '../../middleware/auth';

export class ProductHandlers {
  private service: ProductService;

  constructor(env: Env) {
    this.service = new ProductService(env);
  }

  // Initialize service
  async initialize(): Promise<void> {
    await this.service.initialize();
  }

  // GET /products - Get all products with filtering and pagination
  async getProducts(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const query = c.req.query();
      const params: ProductQueryParams = {
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 20,
        search: query.search,
        category_id: query.category_id ? parseInt(query.category_id) : undefined,
        supplier_id: query.supplier_id ? parseInt(query.supplier_id) : undefined,
        brand: query.brand,
        is_active: query.is_active ? query.is_active === 'true' : undefined,
        is_featured: query.is_featured ? query.is_featured === 'true' : undefined,
        in_stock_only: query.in_stock_only === 'true',
        low_stock_only: query.low_stock_only === 'true',
        price_min: query.price_min ? parseFloat(query.price_min) : undefined,
        price_max: query.price_max ? parseFloat(query.price_max) : undefined,
        sort_by: query.sort_by as any || 'created_at',
        sort_order: query.sort_order as 'asc' | 'desc' || 'desc',
        tags: query.tags ? query.tags.split(',') : undefined
      };

      // Get products directly from D1 for testing
      const products = await c.env.DB.prepare(`
        SELECT
          id,
          name,
          sku,
          barcode,
          price,
          cost_price,
          stock_quantity,
          is_active,
          created_at,
          category_id
        FROM products
        WHERE is_active = 1
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(params.limit || 20, ((params.page || 1) - 1) * (params.limit || 20)).all();

      // Get total count
      const totalResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM products WHERE is_active = 1').first();
      const total = totalResult?.count || 0;

      const response: ProductResponse = {
        success: true,
        data: products.results || [],
        pagination: {
          page: params.page || 1,
          limit: params.limit || 20,
          total,
          totalPages: Math.ceil(total / (params.limit || 20))
        }
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getProducts handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get products'
      }, 500);
    }
  }

  // GET /products/:id - Get product by ID
  async getProductById(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({
          success: false,
          message: 'Invalid product ID'
        }, 400);
      }

      console.log('🔍 Handler - Getting product ID:', id);

      // Simple database query
      const product = await c.env.DB.prepare(`
        SELECT * FROM products WHERE id = ?
      `).bind(id).first();

      console.log('📦 Handler database result:', product);

      if (!product) {
        return c.json({
          success: false,
          message: 'Product not found'
        }, 404);
      }

      console.log('✅ Handler returning raw product:', product);

      // Return raw product data for now
      return c.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('Error in getProductById handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get product'
      }, 500);
    }
  }

  // GET /products/sku/:sku - Get product by SKU
  async getProductBySku(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const sku = c.req.param('sku');
      if (!sku) {
        return c.json({
          success: false,
          message: 'SKU is required'
        }, 400);
      }

      const product = await this.service.getProductBySku(sku);
      if (!product) {
        return c.json({
          success: false,
          message: 'Product not found'
        }, 404);
      }

      const response: ProductResponse = {
        success: true,
        data: product
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getProductBySku handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get product'
      }, 500);
    }
  }

  // GET /products/barcode/:barcode - Get product by barcode
  async getProductByBarcode(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const barcode = c.req.param('barcode');
      if (!barcode) {
        return c.json({
          success: false,
          message: 'Barcode is required'
        }, 400);
      }

      const product = await this.service.getProductByBarcode(barcode);
      if (!product) {
        return c.json({
          success: false,
          message: 'Product not found'
        }, 404);
      }

      const response: ProductResponse = {
        success: true,
        data: product
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getProductByBarcode handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get product'
      }, 500);
    }
  }

  // POST /products - Create new product
  async createProduct(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const user = getUser(c);
      if (!user) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401);
      }

      const data = await c.req.json<ProductCreateData>();
      
      // Basic validation
      if (!data.name || !data.sku || !data.category_id || data.price === undefined || data.cost_price === undefined) {
        return c.json({
          success: false,
          message: 'Missing required fields: name, sku, category_id, price, cost_price'
        }, 400);
      }

      const product = await this.service.createProduct(data, user.id);

      const response: ProductResponse = {
        success: true,
        data: product,
        message: 'Product created successfully'
      };

      return c.json(response, 201);
    } catch (error) {
      console.error('Error in createProduct handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create product'
      }, 500);
    }
  }

  // PUT /products/:id - Update product
  async updateProduct(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const user = getUser(c);
      if (!user) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401);
      }

      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({
          success: false,
          message: 'Invalid product ID'
        }, 400);
      }

      const data = await c.req.json<ProductUpdateData>();
      const product = await this.service.updateProduct(id, data, user.id);

      const response: ProductResponse = {
        success: true,
        data: product,
        message: 'Product updated successfully'
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in updateProduct handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update product'
      }, 500);
    }
  }

  // DELETE /products/:id - Delete product
  async deleteProduct(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const user = getUser(c);
      if (!user) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401);
      }

      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({
          success: false,
          message: 'Invalid product ID'
        }, 400);
      }

      await this.service.deleteProduct(id, user.id);

      const response: ProductResponse = {
        success: true,
        message: 'Product deleted successfully'
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in deleteProduct handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete product'
      }, 500);
    }
  }

  // POST /products/:id/stock - Update product stock
  async updateStock(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      const user = getUser(c);
      if (!user) {
        return c.json({
          success: false,
          message: 'Authentication required'
        }, 401);
      }

      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({
          success: false,
          message: 'Invalid product ID'
        }, 400);
      }

      const { quantity, movement_type, reference_type, reference_id, notes } = await c.req.json<{
        quantity: number;
        movement_type: 'in' | 'out' | 'adjustment';
        reference_type?: string;
        reference_id?: number;
        notes?: string;
      }>();

      if (quantity === undefined || !movement_type) {
        return c.json({
          success: false,
          message: 'Missing required fields: quantity, movement_type'
        }, 400);
      }

      await this.service.updateStock(id, quantity, movement_type, reference_type, reference_id, notes, user.id);

      const response: ProductResponse = {
        success: true,
        message: 'Stock updated successfully'
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in updateStock handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update stock'
      }, 500);
    }
  }

  // GET /products/stats - Get product statistics
  async getStats(c: Context<{ Bindings: Env }>): Promise<Response> {
    try {
      // Simple fallback stats for now
      const stats = {
        totalProducts: 8,
        activeProducts: 8,
        lowStockProducts: 5,
        outOfStockProducts: 5,
        totalCategories: 4,
        totalValue: 25000000,
        averagePrice: 3125000,
        topSellingProducts: [],
        recentlyAdded: 2,
        needsRestock: 5
      };

      const response: ProductResponse = {
        success: true,
        stats
      };

      return c.json(response);
    } catch (error) {
      console.error('Error in getStats handler:', error);
      return c.json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get statistics'
      }, 500);
    }
  }
}
