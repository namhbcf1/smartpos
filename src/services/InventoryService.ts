import { BaseService } from './BaseService';
import { Env } from '../types';

export class InventoryService extends BaseService {
  constructor(env: Env) {
    super(env, 'inventory_movements', 'id');
  }

  async getMovements(tenantId: string, page: number = 1, limit: number = 50) {
    return this.getAll(tenantId, page, limit);
  }

  async getProducts(tenantId: string = 'default', filters?: any): Promise<{ success: boolean; data?: any[]; pagination?: any; error?: string }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 50;
      const offset = (page - 1) * limit;

      const countResult = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM products WHERE tenant_id = ?
      `).bind(tenantId).first();
      const total = Number((countResult as any)?.count) || 0;

      const result = await this.env.DB.prepare(`
        SELECT * FROM products WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
      `).bind(tenantId, limit, offset).all();

      return {
        success: true,
        data: result.results || [],
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getLowStockProducts(tenantId: string = 'default'): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM products WHERE tenant_id = ? AND stock <= min_stock ORDER BY stock ASC LIMIT 50
      `).bind(tenantId).all();
      return { success: true, data: result.results || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async adjustStock(productId: string, tenantId: string, adjustment: number, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date().toISOString();
      await this.env.DB.prepare(`
        UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ? AND tenant_id = ?
      `).bind(adjustment, now, productId, tenantId).run();

      const movementId = crypto.randomUUID();
      await this.env.DB.prepare(`
        INSERT INTO inventory_movements (id, tenant_id, product_id, transaction_type, quantity, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(movementId, tenantId, productId, adjustment > 0 ? 'adjustment_in' : 'adjustment_out', adjustment, reason, now).run();

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getProductById(id: string, tenantId: string = 'default') {
    const result = await this.env.DB.prepare(`
      SELECT * FROM products WHERE id = ? AND tenant_id = ?
    `).bind(id, tenantId).first();
    return { success: !!result, data: result || null };
  }
}
