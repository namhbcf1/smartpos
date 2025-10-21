import { BaseService } from './BaseService';
import { Env } from '../types';

export class SupplierService extends BaseService {
  constructor(env: Env) {
    super(env, 'suppliers', 'id');
  }

  async getSuppliers(tenantId: string, filters: any) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const result = await this.getAll(tenantId, page, limit);
    return { ...result, suppliers: result.data };
  }

  async getSupplierById(id: string, tenantId: string) {
    const result = await this.getById(id, tenantId);
    return { ...result, supplier: result.data };
  }

  async createSupplier(tenantId: string, data: any) {
    const result = await this.create(tenantId, data);
    return { ...result, supplier: result.data };
  }

  async updateSupplier(id: string, tenantId: string, data: any) {
    const result = await this.update(id, tenantId, data);
    return { ...result, supplier: result.data };
  }

  async deleteSupplier(id: string, tenantId: string) {
    return await this.delete(id, tenantId);
  }

  async getAnalytics(tenantId: string) {
    try {
      const total = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM suppliers WHERE tenant_id = ?
      `).bind(tenantId).first();

      const active = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM suppliers WHERE tenant_id = ? AND status = 'active'
      `).bind(tenantId).first();

      return {
        success: true,
        analytics: {
          total: total?.count || 0,
          active: active?.count || 0
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async searchSuppliers(tenantId: string, query: string, limit: number = 50) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM suppliers
        WHERE tenant_id = ? AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)
        ORDER BY name ASC LIMIT ?
      `).bind(tenantId, `%${query}%`, `%${query}%`, `%${query}%`, limit).all();

      return { success: true, suppliers: result.results || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
