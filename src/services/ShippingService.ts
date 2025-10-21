import { BaseService } from './BaseService';
import { Env } from '../types';

export class ShippingService extends BaseService {
  constructor(env: Env) {
    super(env, 'shipping_methods', 'id');
  }

  async getShippingMethods(tenantId: string) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM shipping_methods WHERE tenant_id = ? ORDER BY name ASC
      `).bind(tenantId).all();
      return { success: true, methods: result.results || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getShippingMethodById(id: string, tenantId: string) {
    return await this.getById(id, tenantId);
  }

  async createShippingMethod(tenantId: string, data: any) {
    return await this.create(tenantId, data);
  }

  async updateShippingMethod(id: string, tenantId: string, data: any) {
    return await this.update(id, tenantId, data);
  }

  async deleteShippingMethod(id: string, tenantId: string) {
    return await this.delete(id, tenantId);
  }

  async getTrackingEvents(trackingNumber: string, tenantId: string) {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM shipping_tracking WHERE tracking_number = ? AND tenant_id = ? ORDER BY created_at ASC
      `).bind(trackingNumber, tenantId).all();
      return { success: true, events: result.results || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
