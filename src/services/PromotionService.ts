import { BaseService } from './BaseService';
import { Env } from '../types';

export class PromotionService extends BaseService {
  constructor(env: Env) {
    super(env, 'promotion_campaigns', 'id');
  }

  async getPromotions(tenantIdOrFilters: string | any = 'default', filters?: any) {
    let tenantId: string;
    let actualFilters: any;

    if (typeof tenantIdOrFilters === 'object') {
      tenantId = tenantIdOrFilters.tenant_id || 'default';
      actualFilters = tenantIdOrFilters;
    } else {
      tenantId = tenantIdOrFilters;
      actualFilters = filters || {};
    }

    const result = await this.getAll(tenantId, actualFilters?.page || 1, actualFilters?.limit || 50);
    return { ...result, promotions: result.data };
  }

  async getPromotionById(id: string, tenantId: string = 'default') {
    const result = await this.getById(id, tenantId);
    return { ...result, promotion: result.data };
  }

  async createPromotion(tenantIdOrData: string | any, data?: any) {
    if (typeof tenantIdOrData === 'object') {
      const promotionData = tenantIdOrData;
      const tenantId = promotionData.tenant_id || 'default';
      const result = await this.create(tenantId, promotionData);
      return { ...result, promotion: result.data };
    } else {
      const result = await this.create(tenantIdOrData, data);
      return { ...result, promotion: result.data };
    }
  }

  async updatePromotion(idOrTenantId: string, dataOrId?: any, finalData?: any) {
    if (arguments.length === 2 && typeof dataOrId === 'object' && !finalData) {
      const result = await this.update(idOrTenantId, 'default', dataOrId);
      return { ...result, promotion: result.data };
    } else {
      const result = await this.update(idOrTenantId, dataOrId, finalData);
      return { ...result, promotion: result.data };
    }
  }

  async deletePromotion(id: string, tenantId: string, userId?: string) {
    return await this.delete(id, tenantId);
  }

  async getAnalytics(tenantId: string = 'default'): Promise<{ success: boolean; data?: any; analytics?: any; error?: string }> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT COUNT(*) as total_campaigns,
               SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_campaigns
        FROM promotion_campaigns WHERE tenant_id = ?
      `).bind(tenantId).first();

      const analytics = {
        total_campaigns: result?.total_campaigns || 0,
        active_campaigns: result?.active_campaigns || 0
      };

      return {
        success: true,
        data: analytics,
        analytics: analytics
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async searchPromotions(query: string, tenantId: string = 'default', limit: number = 20): Promise<{ success: boolean; promotions?: any[]; error?: string }> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM promotion_campaigns
        WHERE tenant_id = ? AND (name LIKE ? OR code LIKE ? OR description LIKE ?)
        ORDER BY created_at DESC LIMIT ?
      `).bind(tenantId, `%${query}%`, `%${query}%`, `%${query}%`, limit).all();

      return {
        success: true,
        promotions: result.results || []
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async validatePromotionCode(code: string, tenantId: string = 'default'): Promise<{ success: boolean; promotion?: any; valid?: boolean; error?: string }> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM promotion_campaigns
        WHERE tenant_id = ? AND code = ? AND is_active = 1
      `).bind(tenantId, code).first();

      if (!result) {
        return { success: false, valid: false, error: 'Promotion code not found or inactive' };
      }

      // Check if promotion is still valid (date range check)
      const now = new Date().toISOString();
      if (result.start_date && now < result.start_date) {
        return { success: false, valid: false, error: 'Promotion has not started yet' };
      }
      if (result.end_date && now > result.end_date) {
        return { success: false, valid: false, error: 'Promotion has expired' };
      }

      return {
        success: true,
        valid: true,
        promotion: result
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
