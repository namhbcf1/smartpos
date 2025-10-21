import { BaseService } from './BaseService';
import { Env } from '../types';

export class ProductService extends BaseService {
  constructor(env: Env) {
    super(env, 'products', 'id');
  }

  async getProductStats(tenantId: string = 'default') {
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
      SELECT COALESCE(SUM(price * stock), 0) as total FROM products
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
  }

  async createCategory(data: any): Promise<{ success: boolean; category?: { id: string }; error?: string }> {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await this.env.DB.prepare(`
        INSERT INTO categories (id, tenant_id, name, description, parent_id, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, data.tenant_id || 'default', data.name, data.description || null, data.parent_id || null, data.is_active !== false ? 1 : 0, now, now).run();
      return { success: true, category: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateCategory(id: string, tenantId: string, data: any): Promise<{ success: boolean; category?: { id: string }; error?: string }> {
    try {
      const now = new Date().toISOString();
      await this.env.DB.prepare(`
        UPDATE categories SET name = ?, description = ?, parent_id = ?, is_active = ?, updated_at = ?
        WHERE id = ? AND tenant_id = ?
      `).bind(data.name, data.description, data.parent_id, data.is_active !== false ? 1 : 0, now, id, tenantId).run();
      return { success: true, category: { id } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteCategory(id: string, tenantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.env.DB.prepare(`DELETE FROM categories WHERE id = ? AND tenant_id = ?`).bind(id, tenantId).run();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getCategoryProducts(categoryId: string, tenantId: string, options: any): Promise<{ success: boolean; products?: any[]; pagination?: any; error?: string }> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM products WHERE category_id = ? AND tenant_id = ? LIMIT ?
      `).bind(categoryId, tenantId, options.limit || 50).all();
      return { success: true, products: result.results || [], pagination: { page: 1, total: result.results?.length || 0 } };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
