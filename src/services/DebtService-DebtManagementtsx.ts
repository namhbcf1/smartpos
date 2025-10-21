import { BaseService } from './BaseService';

export interface Debt {
  id: string;
  tenant_id: string;
  customer_id?: string;
  supplier_id?: string;
  debt_type: 'customer' | 'supplier';
  amount: number;
  paid_amount: number;
  remaining: number;
  status: 'unpaid' | 'partial' | 'paid';
  due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDebtData {
  customer_id?: string;
  supplier_id?: string;
  debt_type: 'customer' | 'supplier';
  amount: number;
  paid_amount?: number;
  due_date?: string;
  notes?: string;
  status?: 'unpaid' | 'partial' | 'paid';
  tenantId: string;
  createdBy?: string;
}

export interface UpdateDebtData {
  customer_id?: string;
  supplier_id?: string;
  debt_type?: 'customer' | 'supplier';
  amount?: number;
  paid_amount?: number;
  due_date?: string;
  notes?: string;
  status?: 'unpaid' | 'partial' | 'paid';
  tenantId: string;
  updatedBy?: string;
}

export interface DebtFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'unpaid' | 'partial' | 'paid';
  debt_type?: 'customer' | 'supplier';
  sortBy?: 'amount' | 'due_date' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface DebtAnalytics {
  totalDebts: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  paidDebts: number;
  unpaidDebts: number;
  partialDebts: number;
  collectionRate: number;
  debtsByStatus: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
  recentDebts: Debt[];
}

export interface PaymentData {
  amount: number;
  notes?: string;
  tenantId: string;
  userId?: string;
}

export class DebtService_DebtManagementtsx extends BaseService {
  constructor(env?: any) {
    super(env, 'debts', 'id');
  }

  async getDebts(filters: DebtFilters & { tenantId: string }) {
    try {
      const {
        tenantId,
        page = 1,
        pageSize = 10,
        search,
        status,
        debt_type,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = filters;

      let query = `
        SELECT * FROM debts 
        WHERE tenant_id = ?
      `;
      const params: any[] = [tenantId];

      if (search) {
        query += ` AND (notes LIKE ? OR customer_id LIKE ? OR supplier_id LIKE ?)`;
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }

      if (debt_type) {
        query += ` AND debt_type = ?`;
        params.push(debt_type);
      }

      query += ` ORDER BY ${sortBy} ${String(sortOrder).toUpperCase()}`;

      const offset = (page - 1) * pageSize;
      query += ` LIMIT ? OFFSET ?`;
      params.push(pageSize, offset);

      const debts = await this.env.DB.prepare(query).bind(...params).all();

      let countQuery = `
        SELECT COUNT(*) as total FROM debts 
        WHERE tenant_id = ?
      `;
      const countParams: any[] = [tenantId];

      if (search) {
        countQuery += ` AND (notes LIKE ? OR customer_id LIKE ? OR supplier_id LIKE ?)`;
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm);
      }

      if (status) {
        countQuery += ` AND status = ?`;
        countParams.push(status);
      }

      if (debt_type) {
        countQuery += ` AND debt_type = ?`;
        countParams.push(debt_type);
      }

      const countResult = await this.env.DB.prepare(countQuery).bind(...countParams).first();
      const total = countResult?.total || 0;

      return {
        success: true,
        debts: debts || [],
        pagination: {
          page,
          pageSize,
          total: Number(total) || 0,
          totalPages: Math.ceil(Number(total) / pageSize)
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Không thể lấy danh sách nợ'
      };
    }
  }

  async getDebtById(id: string, tenantId: string) {
    try {
      const query = `
        SELECT * FROM debts 
        WHERE id = ? AND tenant_id = ?
      `;
      const debt = await this.env.DB.prepare(query).bind(id, tenantId).first();
      if (!debt) {
        return { success: false, error: 'Không tìm thấy nợ' };
      }
      return { success: true, debt };
    } catch (error: any) {
      return { success: false, error: error.message || 'Không thể lấy thông tin nợ' };
    }
  }

  async createDebt(data: CreateDebtData) {
    try {
      const {
        customer_id,
        supplier_id,
        debt_type,
        amount,
        paid_amount = 0,
        due_date,
        notes,
        status = 'unpaid',
        tenantId
      } = data;

      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const remaining = amount - paid_amount;
      const finalStatus = remaining <= 0 ? 'paid' : (paid_amount > 0 ? 'partial' : status);

      const query = `
        INSERT INTO debts (
          id, tenant_id, customer_id, supplier_id, debt_type, amount, 
          paid_amount, remaining, status, due_date, notes, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await this.env.DB.prepare(query).bind(
        id,
        tenantId,
        customer_id || null,
        supplier_id || null,
        debt_type,
        amount,
        paid_amount,
        remaining,
        finalStatus,
        due_date || null,
        notes || null,
        now,
        now
      ).run();

      const debt = await this.getDebtById(id, tenantId);
      return { success: true, debt: (debt as any).debt };
    } catch (error: any) {
      return { success: false, error: error.message || 'Không thể tạo nợ' };
    }
  }

  async updateDebt(id: string, data: UpdateDebtData) {
    try {
      const existingDebt = await this.getDebtById(id, data.tenantId);
      if (!existingDebt.success) return existingDebt as any;

      const {
        customer_id,
        supplier_id,
        debt_type,
        amount,
        paid_amount,
        due_date,
        notes,
        status,
        tenantId,
        updatedBy
      } = data;

      const updateFields: string[] = [];
      const params: any[] = [];

      if (customer_id !== undefined) { updateFields.push('customer_id = ?'); params.push(customer_id); }
      if (supplier_id !== undefined) { updateFields.push('supplier_id = ?'); params.push(supplier_id); }
      if (debt_type !== undefined) { updateFields.push('debt_type = ?'); params.push(debt_type); }
      if (amount !== undefined) { updateFields.push('amount = ?'); params.push(amount); }
      if (paid_amount !== undefined) { updateFields.push('paid_amount = ?'); params.push(paid_amount); }
      if (due_date !== undefined) { updateFields.push('due_date = ?'); params.push(due_date); }
      if (notes !== undefined) { updateFields.push('notes = ?'); params.push(notes); }
      if (status !== undefined) { updateFields.push('status = ?'); params.push(status); }

      if (updateFields.length === 0) {
        return { success: false, error: 'Không có dữ liệu để cập nhật' };
      }

      const finalAmount = amount !== undefined ? amount : (existingDebt as any).debt.amount;
      const finalPaidAmount = paid_amount !== undefined ? paid_amount : (existingDebt as any).debt.paid_amount;
      const remaining = finalAmount - finalPaidAmount;
      const finalStatus = remaining <= 0 ? 'paid' : (finalPaidAmount > 0 ? 'partial' : ((existingDebt as any).debt.status));

      updateFields.push('remaining = ?', 'status = ?', 'updated_by = ?', 'updated_at = ?');
      params.push(remaining, finalStatus, updatedBy || null, new Date().toISOString());
      params.push(id, tenantId);

      const query = `
        UPDATE debts 
        SET ${updateFields.join(', ')}
        WHERE id = ? AND tenant_id = ?
      `;

      await this.env.DB.prepare(query).bind(...params).run();

      const debt = await this.getDebtById(id, tenantId);
      return { success: true, debt: (debt as any).debt };
    } catch (error: any) {
      return { success: false, error: error.message || 'Không thể cập nhật nợ' };
    }
  }

  async deleteDebt(id: string, tenantId: string) {
    try {
      const existingDebt = await this.getDebtById(id, tenantId);
      if (!existingDebt.success) return existingDebt as any;

      const query = `
        DELETE FROM debts 
        WHERE id = ? AND tenant_id = ?
      `;
      const result = await this.env.DB.prepare(query).bind(id, tenantId).run();
      if ((result.meta as any)?.changes === 0) {
        return { success: false, error: 'Không thể xóa nợ' };
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Không thể xóa nợ' };
    }
  }

  async makePayment(id: string, data: PaymentData) {
    try {
      const { amount, notes, tenantId, userId } = data;

      const existingDebt = await this.getDebtById(id, tenantId);
      if (!existingDebt.success) return existingDebt as any;

      const currentPaidAmount = (existingDebt as any).debt.paid_amount || 0;
      const newPaidAmount = currentPaidAmount + amount;

      const updateResult = await this.updateDebt(id, {
        paid_amount: newPaidAmount,
        tenantId,
        updatedBy: userId
      } as UpdateDebtData);
      if (!updateResult.success) return updateResult as any;

      const paymentId = crypto.randomUUID();
      const now = new Date().toISOString();
      try {
        await this.env.DB.prepare(`
          INSERT INTO debt_payments (
            id, debt_id, amount, notes, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(paymentId, id, amount, notes || null, userId || null, now).run();
      } catch {}

      return {
        success: true,
        payment: { id: paymentId, debt_id: id, amount, notes, created_at: now }
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Không thể thực hiện thanh toán' };
    }
  }

  async getDebtAnalytics(tenantId: string): Promise<DebtAnalytics> {
    const totalResult = await this.env.DB.prepare(`
      SELECT COUNT(*) as total FROM debts WHERE tenant_id = ?
    `).bind(tenantId).first();
    const totalDebts = totalResult?.total || 0;

    const amountResult = await this.env.DB.prepare(`
      SELECT SUM(amount) as total FROM debts WHERE tenant_id = ?
    `).bind(tenantId).first();
    const totalAmount = amountResult?.total || 0;

    const paidResult = await this.env.DB.prepare(`
      SELECT SUM(paid_amount) as total FROM debts WHERE tenant_id = ?
    `).bind(tenantId).first();
    const totalPaid = Number((paidResult as any)?.total) || 0;

    const totalRemaining = Number(totalAmount) - totalPaid;

    const statusResult = await this.env.DB.prepare(`
      SELECT status, COUNT(*) as count, SUM(amount) as amount
      FROM debts WHERE tenant_id = ?
      GROUP BY status
    `).bind(tenantId).all();

    const statusData = (statusResult.results || []) as any[];
    const paidDebts = Number(statusData.find((s: any) => s.status === 'paid')?.count) || 0;
    const unpaidDebts = Number(statusData.find((s: any) => s.status === 'unpaid')?.count) || 0;
    const partialDebts = Number(statusData.find((s: any) => s.status === 'partial')?.count) || 0;

    const collectionRate = Number(totalAmount) > 0 ? Math.round((totalPaid / Number(totalAmount)) * 100) : 0;

    const debtsByStatus = statusData.map((s: any) => ({
      status: s.status === 'paid' ? 'Đã trả' : s.status === 'partial' ? 'Trả một phần' : 'Chưa trả',
      count: s.count,
      amount: s.amount || 0
    }));

    const recentDebts = await this.env.DB.prepare(`
      SELECT * FROM debts 
      WHERE tenant_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `).bind(tenantId).all();

    return {
      totalDebts: Number(totalDebts) || 0,
      totalAmount: Number(totalAmount) || 0,
      totalPaid: Number(totalPaid) || 0,
      totalRemaining,
      paidDebts,
      unpaidDebts,
      partialDebts,
      collectionRate,
      debtsByStatus,
      recentDebts: (recentDebts.results || []) as any[]
    };
  }

  async bulkDeleteDebts(ids: string[], tenantId: string) {
    try {
      const placeholders = ids.map(() => '?').join(',');
      const query = `
        DELETE FROM debts 
        WHERE id IN (${placeholders}) AND tenant_id = ?
      `;
      const result = await this.env.DB.prepare(query).bind(...ids, tenantId).run();
      return { success: true, deletedCount: (result.meta as any)?.changes || 0 };
    } catch (error: any) {
      return { success: false, error: error.message || 'Không thể xóa hàng loạt nợ' };
    }
  }

  async bulkUpdateDebts(ids: string[], data: UpdateDebtData) {
    try {
      const {
        customer_id,
        supplier_id,
        debt_type,
        amount,
        paid_amount,
        due_date,
        notes,
        status,
        tenantId,
        updatedBy
      } = data;

      const updateFields: string[] = [];
      const params: any[] = [];

      if (customer_id !== undefined) { updateFields.push('customer_id = ?'); params.push(customer_id); }
      if (supplier_id !== undefined) { updateFields.push('supplier_id = ?'); params.push(supplier_id); }
      if (debt_type !== undefined) { updateFields.push('debt_type = ?'); params.push(debt_type); }
      if (amount !== undefined) { updateFields.push('amount = ?'); params.push(amount); }
      if (paid_amount !== undefined) { updateFields.push('paid_amount = ?'); params.push(paid_amount); }
      if (due_date !== undefined) { updateFields.push('due_date = ?'); params.push(due_date); }
      if (notes !== undefined) { updateFields.push('notes = ?'); params.push(notes); }
      if (status !== undefined) { updateFields.push('status = ?'); params.push(status); }

      if (updateFields.length === 0) {
        return { success: false, error: 'Không có dữ liệu để cập nhật' };
      }

      updateFields.push('updated_by = ?', 'updated_at = ?');
      params.push(updatedBy || null, new Date().toISOString());

      const placeholders = ids.map(() => '?').join(',');
      params.push(...ids, tenantId);

      const query = `
        UPDATE debts 
        SET ${updateFields.join(', ')}
        WHERE id IN (${placeholders}) AND tenant_id = ?
      `;

      const result = await this.env.DB.prepare(query).bind(...params).run();
      return { success: true, updatedCount: (result.meta as any)?.changes || 0 };
    } catch (error: any) {
      return { success: false, error: error.message || 'Không thể cập nhật hàng loạt nợ' };
    }
  }

  async exportDebts(tenantId: string, format: 'csv' | 'excel' = 'csv') {
    try {
      const debts = await this.env.DB.prepare(`
        SELECT * FROM debts 
        WHERE tenant_id = ? 
        ORDER BY created_at DESC
      `).bind(tenantId).all();

      if (format === 'csv') {
        const headers = ['ID', 'Loại nợ', 'Số tiền', 'Đã trả', 'Còn lại', 'Trạng thái', 'Ngày đến hạn', 'Ghi chú', 'Ngày tạo'];
        const rows = (debts.results || []).map((d: any) => [
          d.id,
          d.debt_type === 'customer' ? 'Nợ khách hàng' : 'Nợ nhà cung cấp',
          d.amount,
          d.paid_amount,
          d.remaining,
          d.status === 'paid' ? 'Đã trả' : d.status === 'partial' ? 'Trả một phần' : 'Chưa trả',
          d.due_date || '',
          d.notes || '',
          d.created_at
        ]);
        const csvContent = [headers, ...rows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
        return { success: true, data: csvContent };
      } else {
        return this.exportDebts(tenantId, 'csv');
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Không thể xuất nợ' };
    }
  }

  async importDebts(csvContent: string, tenantId: string, userId?: string) {
    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return { success: false, error: 'File CSV không hợp lệ hoặc không có dữ liệu' };
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      let importedCount = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
          const debt_type = values[1]?.includes('khách hàng') ? 'customer' : 'supplier';
          const amount = parseFloat(values[2]) || 0;
          const paid_amount = parseFloat(values[3]) || 0;
          const due_date = values[6] || undefined;
          const notes = values[7] || undefined;

          await this.createDebt({
            debt_type,
            amount,
            paid_amount,
            due_date,
            notes,
            tenantId,
            createdBy: userId
          });
          importedCount++;
        } catch (error: any) {
          errors.push(`Dòng ${i + 1}: ${error.message}`);
        }
      }

      return {
        success: true,
        importedCount,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Không thể import nợ' };
    }
  }
}

