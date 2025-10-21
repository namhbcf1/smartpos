import { BaseService } from './BaseService';
import { Env } from '../types';

export class WarrantyService extends BaseService {
  constructor(env: Env) {
    super(env, 'warranties', 'id');
  }

  async getWarranties(tenantId: string, filters: any) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const result = await this.getAll(tenantId, page, limit);
    return { ...result, warranties: result.data };
  }

  async getWarrantyById(id: string, tenantId: string) {
    const result = await this.getById(id, tenantId);
    return { ...result, warranty: result.data };
  }

  async createWarranty(tenantId: string, data: any) {
    const result = await this.create(tenantId, data);
    return { ...result, warranty: result.data };
  }

  async updateWarranty(id: string, tenantId: string, data: any) {
    const result = await this.update(id, tenantId, data);
    return { ...result, warranty: result.data };
  }

  async deleteWarranty(id: string, tenantId: string) {
    return await this.delete(id, tenantId);
  }

  async getAnalytics(tenantId: string) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
          SUM(CASE WHEN status = 'claimed' THEN 1 ELSE 0 END) as claimed
        FROM warranties
        WHERE tenant_id = ?
      `).bind(tenantId).first();
      return { success: true, analytics: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async searchWarranties(query: string, tenantId: string, limit: number = 10) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM warranties
        WHERE tenant_id = ? AND (
          warranty_code LIKE ? OR
          product_id LIKE ? OR
          customer_id LIKE ?
        )
        ORDER BY created_at DESC
        LIMIT ?
      `).bind(tenantId, `%${query}%`, `%${query}%`, `%${query}%`, limit).all();
      return { success: true, warranties: result.results || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async validateWarrantyCode(code: string, tenantId: string) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM warranties
        WHERE warranty_code = ? AND tenant_id = ?
      `).bind(code, tenantId).first();

      if (!result) {
        return { success: false, error: 'Mã bảo hành không tồn tại' };
      }

      return { success: true, warranty: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
