import { Env } from '../types';

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price_cents: number;
  cost_price_cents: number;
  stock: number;
  min_stock?: number;
  max_stock?: number;
  unit?: string;
  weight_grams?: number;
  dimensions?: string;
  category_id?: string;
  category_name?: string;
  brand_id?: string;
  brand_name?: string;
  supplier_id?: string;
  store_id?: string;
  image_url?: string;
  images?: string;
  is_active?: number;
  is_serialized?: number;
  created_at?: string;
  updated_at?: string;
  tenant_id: string;
}

export interface CreateProductData {
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price_cents: number;
  cost_price_cents: number;
  stock: number;
  min_stock?: number;
  max_stock?: number;
  unit?: string;
  weight_grams?: number;
  dimensions?: string;
  category_id?: string;
  brand_id?: string;
  supplier_id?: string;
  store_id?: string;
  image_url?: string;
  images?: string;
  is_active?: number;
  is_serialized?: number;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export class ProductService_ProductListtsx {
  constructor(private env: Env) {}

  async getProducts(
    tenantId: string | { page?: number; limit?: number; search?: string; categoryId?: string; brandId?: string; isActive?: boolean },
    page?: number,
    limit?: number,
    search?: string,
    categoryId?: string,
    brandId?: string,
    isActive?: boolean
  ) {
    // Handle both object and individual parameters
    if (typeof tenantId === 'object') {
      const filters = tenantId;
      tenantId = 'default';
      page = filters.page || 1;
      limit = filters.limit || 50;
      search = filters.search;
      categoryId = filters.categoryId;
      brandId = filters.brandId;
      isActive = filters.isActive;
    }

    page = page || 1;
    limit = limit || 50;
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT
          p.*,
          c.name as category_name,
          b.name as brand_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.tenant_id = ?
      `;

      const params: any[] = [tenantId];

      if (search) {
        query += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)`;
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
      }

      if (categoryId) {
        query += ` AND p.category_id = ?`;
        params.push(categoryId);
      }

      if (brandId) {
        query += ` AND p.brand_id = ?`;
        params.push(brandId);
      }

      if (isActive !== undefined) {
        query += ` AND p.is_active = ?`;
        params.push(isActive ? 1 : 0);
      }

      query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const products = await this.env.DB.prepare(query).bind(...params).all();

      // Count total
      let countQuery = `SELECT COUNT(*) as total FROM products WHERE tenant_id = ?`;
      const countParams: any[] = [tenantId];

      if (search) {
        countQuery += ` AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)`;
        const searchParam = `%${search}%`;
        countParams.push(searchParam, searchParam, searchParam);
      }

      if (categoryId) {
        countQuery += ` AND category_id = ?`;
        countParams.push(categoryId);
      }

      if (brandId) {
        countQuery += ` AND brand_id = ?`;
        countParams.push(brandId);
      }

      if (isActive !== undefined) {
        countQuery += ` AND is_active = ?`;
        countParams.push(isActive ? 1 : 0);
      }

      const countResult = await this.env.DB.prepare(countQuery).bind(...countParams).first();

      return {
        success: true,
        data: products.results || [],
        products: products.results || [],
        pagination: {
          page,
          limit,
          total: Number((countResult as any)?.total) || 0,
          pages: Math.ceil((Number((countResult as any)?.total) || 0) / limit)
        }
      };
    } catch (error: any) {
      console.error('Get products error:', error);
      return { success: false, error: error.message || 'Lỗi khi tải sản phẩm' };
    }
  }

  async getProductById(productId: string, tenantId: string) {
    try {
      const product = await this.env.DB.prepare(`
        SELECT
          p.*,
          c.name as category_name,
          b.name as brand_name,
          s.name as supplier_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        WHERE p.id = ? AND p.tenant_id = ?
      `).bind(productId, tenantId).first();

      if (!product) {
        return { success: false, error: 'Không tìm thấy sản phẩm' };
      }

      // Get product variants
      const variants = await this.env.DB.prepare(`
        SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1
      `).bind(productId).all();

      return {
        success: true,
        product: {
          ...product,
          variants: variants.results || []
        }
      };
    } catch (error: any) {
      console.error('Get product error:', error);
      return { success: false, error: error.message || 'Lỗi khi tải sản phẩm' };
    }
  }

  async createProduct(tenantId: string, data: CreateProductData) {
    try {
      const productId = `prod_${Date.now()}`;
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        INSERT INTO products (
          id, tenant_id, name, sku, barcode, description,
          price_cents, cost_price_cents, stock, min_stock, max_stock,
          unit, weight_grams, dimensions, category_id, brand_id, supplier_id,
          store_id, image_url, images, is_active, is_serialized,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        productId,
        tenantId,
        data.name,
        data.sku,
        data.barcode || null,
        data.description || null,
        data.price_cents,
        data.cost_price_cents,
        data.stock || 0,
        data.min_stock || null,
        data.max_stock || null,
        data.unit || null,
        data.weight_grams || null,
        data.dimensions || null,
        data.category_id || null,
        data.brand_id || null,
        data.supplier_id || null,
        data.store_id || null,
        data.image_url || null,
        data.images || null,
        data.is_active !== undefined ? data.is_active : 1,
        data.is_serialized || 0,
        now,
        now
      ).run();

      // Create initial inventory movement
      const movementId = `movement_${Date.now()}`;
      await this.env.DB.prepare(`
        INSERT INTO inventory_movements (
          id, tenant_id, product_id, transaction_type, quantity,
          unit_cost_cents, product_name, product_sku, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        movementId,
        tenantId,
        productId,
        'initial_stock',
        data.stock || 0,
        data.cost_price_cents,
        data.name,
        data.sku,
        now
      ).run();

      return {
        success: true,
        product_id: productId,
        message: 'Tạo sản phẩm thành công'
      };
    } catch (error: any) {
      console.error('Create product error:', error);
      return { success: false, error: error.message || 'Lỗi khi tạo sản phẩm' };
    }
  }

  async updateProduct(productId: string, tenantId: string, data: UpdateProductData) {
    try {
      const now = new Date().toISOString();
      const updates: string[] = [];
      const params: any[] = [];

      // Build dynamic update query
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updates.push(`${key} = ?`);
          params.push(value);
        }
      });

      if (updates.length === 0) {
        return { success: false, error: 'Không có dữ liệu để cập nhật' };
      }

      updates.push('updated_at = ?');
      params.push(now, productId, tenantId);

      await this.env.DB.prepare(`
        UPDATE products
        SET ${updates.join(', ')}
        WHERE id = ? AND tenant_id = ?
      `).bind(...params).run();

      return {
        success: true,
        message: 'Cập nhật sản phẩm thành công'
      };
    } catch (error: any) {
      console.error('Update product error:', error);
      return { success: false, error: error.message || 'Lỗi khi cập nhật sản phẩm' };
    }
  }

  async deleteProduct(productId: string, tenantId: string) {
    try {
      // Soft delete by setting is_active to 0
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        UPDATE products
        SET is_active = 0, updated_at = ?
        WHERE id = ? AND tenant_id = ?
      `).bind(now, productId, tenantId).run();

      return {
        success: true,
        message: 'Xóa sản phẩm thành công'
      };
    } catch (error: any) {
      console.error('Delete product error:', error);
      return { success: false, error: error.message || 'Lỗi khi xóa sản phẩm' };
    }
  }

  async getLowStockProducts(tenantId: string, limit: number = 20) {
    try {
      const products = await this.env.DB.prepare(`
        SELECT
          p.*,
          c.name as category_name,
          b.name as brand_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.tenant_id = ?
          AND p.is_active = 1
          AND p.stock <= COALESCE(p.min_stock, 10)
        ORDER BY p.stock ASC
        LIMIT ?
      `).bind(tenantId, limit).all();

      return {
        success: true,
        products: products.results || []
      };
    } catch (error: any) {
      console.error('Get low stock products error:', error);
      return { success: false, error: error.message || 'Lỗi khi tải sản phẩm tồn kho thấp' };
    }
  }

  async updateStock(productId: string, tenantId: string, quantity: number, reason: string, userId?: string) {
    try {
      const now = new Date().toISOString();

      // Get product info
      const product = await this.env.DB.prepare(`
        SELECT * FROM products WHERE id = ? AND tenant_id = ?
      `).bind(productId, tenantId).first();

      if (!product) {
        return { success: false, error: 'Không tìm thấy sản phẩm' };
      }

      // Update stock
      await this.env.DB.prepare(`
        UPDATE products
        SET stock = stock + ?, updated_at = ?
        WHERE id = ? AND tenant_id = ?
      `).bind(quantity, now, productId, tenantId).run();

      // Create inventory movement
      const movementId = `movement_${Date.now()}`;
      await this.env.DB.prepare(`
        INSERT INTO inventory_movements (
          id, tenant_id, product_id, transaction_type, quantity,
          reason, product_name, product_sku, user_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        movementId,
        tenantId,
        productId,
        quantity > 0 ? 'adjustment_in' : 'adjustment_out',
        quantity,
        reason,
        product.name,
        product.sku,
        userId || null,
        now
      ).run();

      return {
        success: true,
        message: 'Cập nhật tồn kho thành công'
      };
    } catch (error: any) {
      console.error('Update stock error:', error);
      return { success: false, error: error.message || 'Lỗi khi cập nhật tồn kho' };
    }
  }

  async getProductStats(tenantId: string = 'default') {
    try {
      const totalProducts = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM products WHERE tenant_id = ?
      `).bind(tenantId).first();

      const lowStockCount = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM products
        WHERE tenant_id = ? AND stock <= min_stock
      `).bind(tenantId).first();

      const outOfStockCount = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM products
        WHERE tenant_id = ? AND stock = 0
      `).bind(tenantId).first();

      const totalValue = await this.env.DB.prepare(`
        SELECT COALESCE(SUM(price_cents * stock), 0) as total FROM products
        WHERE tenant_id = ?
      `).bind(tenantId).first();

      return {
        success: true,
        stats: {
          total_products: totalProducts?.count || 0,
          low_stock: lowStockCount?.count || 0,
          out_of_stock: outOfStockCount?.count || 0,
          total_value: totalValue?.total || 0
        }
      };
    } catch (error: any) {
      console.error('Get product stats error:', error);
      return { success: false, error: error.message || 'Lỗi khi tải thống kê sản phẩm' };
    }
  }
}
