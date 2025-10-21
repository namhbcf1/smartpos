import { Env } from '../types';

export interface Invoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  customer_id?: string;
  order_id?: string;
  total_amount: number;
  paid_amount: number;
  status: string;
  due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export class InvoiceService_InvoicesManagementtsx {
  constructor(private env: Env) {}

  async getInvoices(tenantId: string, filters: {
    page?: number;
    limit?: number;
    status?: string;
    customer_id?: string;
  } = {}) {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 50;
      const offset = (page - 1) * limit;

      let query = `SELECT * FROM invoices WHERE tenant_id = ?`;
      const params: any[] = [tenantId];

      if (filters.status) {
        query += ` AND status = ?`;
        params.push(filters.status);
      }

      if (filters.customer_id) {
        query += ` AND customer_id = ?`;
        params.push(filters.customer_id);
      }

      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const invoices = await this.env.DB.prepare(query).bind(...params).all();

      let countQuery = `SELECT COUNT(*) as total FROM invoices WHERE tenant_id = ?`;
      const countParams: any[] = [tenantId];

      if (filters.status) {
        countQuery += ` AND status = ?`;
        countParams.push(filters.status);
      }

      const countResult = await this.env.DB.prepare(countQuery).bind(...countParams).first();

      return {
        success: true,
        invoices: invoices.results || [],
        pagination: {
          page,
          limit,
          total: countResult?.total || 0,
          pages: Math.ceil((countResult?.total || 0) / limit)
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải hóa đơn' };
    }
  }

  async getInvoiceById(id: string, tenantId: string) {
    try {
      const invoice = await this.env.DB.prepare(`
        SELECT * FROM invoices WHERE id = ? AND tenant_id = ?
      `).bind(id, tenantId).first();

      if (!invoice) {
        return { success: false, error: 'Không tìm thấy hóa đơn' };
      }

      return { success: true, invoice };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tải hóa đơn' };
    }
  }

  async createInvoice(tenantId: string, data: Partial<Invoice>) {
    try {
      const id = crypto.randomUUID();
      const invoiceNumber = `INV-${Date.now()}`;
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        INSERT INTO invoices (
          id, tenant_id, invoice_number, customer_id, order_id,
          total_amount, paid_amount, status, due_date, notes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        tenantId,
        invoiceNumber,
        data.customer_id || null,
        data.order_id || null,
        data.total_amount || 0,
        data.paid_amount || 0,
        data.status || 'pending',
        data.due_date || null,
        data.notes || null,
        now,
        now
      ).run();

      return this.getInvoiceById(id, tenantId);
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi tạo hóa đơn' };
    }
  }

  async updateInvoice(id: string, tenantId: string, data: Partial<Invoice>) {
    try {
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: any[] = [];

      if (data.customer_id !== undefined) { fields.push('customer_id = ?'); values.push(data.customer_id); }
      if (data.order_id !== undefined) { fields.push('order_id = ?'); values.push(data.order_id); }
      if (data.total_amount !== undefined) { fields.push('total_amount = ?'); values.push(data.total_amount); }
      if (data.paid_amount !== undefined) { fields.push('paid_amount = ?'); values.push(data.paid_amount); }
      if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
      if (data.due_date !== undefined) { fields.push('due_date = ?'); values.push(data.due_date); }
      if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }

      if (fields.length === 0) {
        return { success: false, error: 'Không có dữ liệu để cập nhật' };
      }

      fields.push('updated_at = ?');
      values.push(now, id, tenantId);

      await this.env.DB.prepare(`
        UPDATE invoices SET ${fields.join(', ')}
        WHERE id = ? AND tenant_id = ?
      `).bind(...values).run();

      return this.getInvoiceById(id, tenantId);
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi cập nhật hóa đơn' };
    }
  }

  async deleteInvoice(id: string, tenantId: string) {
    try {
      const result = await this.env.DB.prepare(`
        DELETE FROM invoices WHERE id = ? AND tenant_id = ?
      `).bind(id, tenantId).run();

      if (result.changes === 0) {
        return { success: false, error: 'Không tìm thấy hóa đơn' };
      }

      return { success: true, message: 'Đã xóa hóa đơn' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Lỗi khi xóa hóa đơn' };
    }
  }
}
