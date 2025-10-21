import { BaseService } from './BaseService';
import { Env } from '../types';

export class TaxService extends BaseService {
  constructor(env: Env) {
    super(env, 'tax_rates', 'id');
  }

  async calculateTax(amount: number, taxRate: number = 10): Promise<{ success: boolean; tax?: number; total?: number; error?: string }> {
    try {
      const tax = Math.round(amount * (taxRate / 100));
      const total = amount + tax;
      return { success: true, tax, total };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getTaxRules(tenantId: string = 'default'): Promise<{ success: boolean; rules?: any[]; error?: string }> {
    try {
      const result = await this.env.DB.prepare(`
        SELECT * FROM tax_rates WHERE tenant_id = ? OR tenant_id IS NULL ORDER BY created_at DESC
      `).bind(tenantId).all();

      return { success: true, rules: result.results || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
