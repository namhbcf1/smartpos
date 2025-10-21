import { BaseService } from './BaseService';
import { Env } from '../types';

export class WarehouseService extends BaseService {
  constructor(env: Env) {
    super(env, 'warehouses', 'id');
  }

  async getWarehouses(tenantId: string, filters: any) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const result = await this.getAll(tenantId, page, limit);
    return { ...result, warehouses: result.data };
  }

  async getWarehouseById(id: string, tenantId: string) {
    const result = await this.getById(id, tenantId);
    return { ...result, warehouse: result.data };
  }

  async createWarehouse(tenantId: string, data: any) {
    const result = await this.create(tenantId, data);
    return { ...result, warehouse: result.data };
  }

  async updateWarehouse(id: string, tenantId: string, data: any) {
    const result = await this.update(id, tenantId, data);
    return { ...result, warehouse: result.data };
  }

  async deleteWarehouse(id: string, tenantId: string) {
    return await this.delete(id, tenantId);
  }

  async getWarehouseAnalytics(tenantId: string) {
    try {
      const total = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM warehouses WHERE tenant_id = ?
      `).bind(tenantId).first();

      const active = await this.env.DB.prepare(`
        SELECT COUNT(*) as count FROM warehouses WHERE tenant_id = ? AND is_active = 1
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

  async validateWarehouseCode(code: string, tenantId: string) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT id FROM warehouses WHERE code = ? AND tenant_id = ?
      `).bind(code, tenantId).first();

      return {
        success: true,
        isValid: !result,
        message: result ? 'Mã kho đã tồn tại' : 'Mã kho hợp lệ'
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async bulkDeleteWarehouses(ids: string[], tenantId: string) {
    try {
      let deletedCount = 0;
      for (const id of ids) {
        await this.delete(id, tenantId);
        deletedCount++;
      }
      return { success: true, deleted_count: deletedCount };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async bulkUpdateWarehouses(ids: string[], tenantId: string, data: any) {
    try {
      let updatedCount = 0;
      for (const id of ids) {
        await this.update(id, tenantId, data);
        updatedCount++;
      }
      return { success: true, updated_count: updatedCount };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async exportWarehouses(tenantId: string, format: string) {
    try {
      const warehouses = await this.getAll(tenantId, 1, 10000);
      return { success: true, data: warehouses.data, format };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async importWarehouses(tenantId: string, data: any[]) {
    try {
      let importedCount = 0;
      for (const warehouse of data) {
        await this.create(tenantId, warehouse);
        importedCount++;
      }
      return { success: true, imported_count: importedCount };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
