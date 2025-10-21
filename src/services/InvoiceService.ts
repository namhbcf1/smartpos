import { BaseService } from './BaseService';
import { Env } from '../types';

export class InvoiceService extends BaseService {
  constructor(env: Env) {
    super(env, 'invoices', 'id');
  }

  async getInvoices(tenantId: string = 'default', filters?: any) {
    return await this.getAll(tenantId, filters?.page || 1, filters?.limit || 50);
  }

  async getInvoiceById(id: string, tenantId: string = 'default') {
    return await this.getById(id, tenantId);
  }

  async createInvoice(tenantId: string, data: any) {
    return await this.create(tenantId, data);
  }

  async updateInvoice(id: string, tenantId: string, data: any) {
    return await this.update(id, tenantId, data);
  }

  async deleteInvoice(id: string, tenantId: string) {
    return await this.delete(id, tenantId);
  }
}
