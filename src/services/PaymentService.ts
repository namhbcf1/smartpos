import { BaseService } from './BaseService';
import { Env } from '../types';

export class PaymentService extends BaseService {
  constructor(env: Env) {
    super(env, 'payment_transactions', 'id');
  }

  async getPayments(tenantId: string = 'default', filters?: any) {
    return await this.getAll(tenantId, filters?.page || 1, filters?.limit || 50);
  }

  async getPaymentById(id: string, tenantId: string = 'default') {
    return await this.getById(id, tenantId);
  }

  async createPayment(tenantId: string, data: any) {
    return await this.create(tenantId, data);
  }

  async processPayment(paymentId: string, tenantId: string) {
    const now = new Date().toISOString();
    await this.env.DB.prepare(`
      UPDATE payment_transactions SET status = 'completed', updated_at = ? WHERE id = ? AND tenant_id = ?
    `).bind(now, paymentId, tenantId).run();
    return { success: true };
  }

  async refundPayment(paymentId: string, tenantId: string, amount: number) {
    const now = new Date().toISOString();
    const refundId = crypto.randomUUID();
    await this.env.DB.prepare(`
      INSERT INTO payment_transactions (id, tenant_id, parent_transaction_id, amount, payment_method, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'refund', 'completed', ?, ?)
    `).bind(refundId, tenantId, paymentId, -amount, now, now).run();
    return { success: true, refund_id: refundId };
  }
}
