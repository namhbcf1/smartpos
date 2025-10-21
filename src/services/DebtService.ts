import { BaseService } from './BaseService';
import { Env } from '../types';

export class DebtService extends BaseService {
  constructor(env: Env) {
    super(env, 'debts', 'id');
  }

  async getDebts(tenantId: string = 'default', filters?: any) {
    return await this.getAll(tenantId, filters?.page || 1, filters?.limit || 50);
  }

  async getDebtById(id: string, tenantId: string = 'default') {
    return await this.getById(id, tenantId);
  }

  async createDebt(tenantId: string, data: any) {
    return await this.create(tenantId, data);
  }

  async updateDebt(id: string, tenantId: string, data: any) {
    return await this.update(id, tenantId, data);
  }

  async deleteDebt(id: string, tenantId: string) {
    return await this.delete(id, tenantId);
  }

  async bulkDeleteDebts(ids: string[], tenantId: string): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    try {
      const results = [];
      for (const id of ids) {
        const result = await this.delete(id, tenantId);
        if (result.success) results.push(id);
      }
      return { success: true, deletedCount: results.length };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async bulkUpdateDebts(ids: string[], data: any): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
    try {
      const tenantId = data.tenantId || 'default';
      const results = [];
      for (const id of ids) {
        const result = await this.update(id, tenantId, data);
        if (result.success) results.push(id);
      }
      return { success: true, updatedCount: results.length };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async exportDebts(tenantId: string, format: 'csv' | 'excel'): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const debts = await this.getAll(tenantId, 1, 10000);
      if (!debts.success) return { success: false, error: debts.error };

      // Simple CSV export
      const headers = 'id,customer_id,supplier_id,debt_type,amount,paid_amount,status,due_date,notes\n';
      const rows = (debts.data || []).map((d: any) =>
        `${d.id},${d.customer_id || ''},${d.supplier_id || ''},${d.debt_type},${d.amount},${d.paid_amount},${d.status},${d.due_date || ''},${d.notes || ''}`
      ).join('\n');

      return { success: true, data: headers + rows };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async importDebts(file: File, tenantId: string, userId: string): Promise<{ success: boolean; importedCount?: number; error?: string }> {
    try {
      // Simple CSV import implementation
      const text = await file.text();
      const lines = text.split('\n').slice(1); // Skip header
      let importedCount = 0;

      for (const line of lines) {
        if (!line.trim()) continue;
        const [,customer_id, supplier_id, debt_type, amount, paid_amount, status, due_date, notes] = line.split(',');
        await this.create(tenantId, {
          customer_id: customer_id || null,
          supplier_id: supplier_id || null,
          debt_type,
          amount: parseFloat(amount),
          paid_amount: parseFloat(paid_amount || '0'),
          status,
          due_date: due_date || null,
          notes: notes || null
        });
        importedCount++;
      }

      return { success: true, importedCount };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
