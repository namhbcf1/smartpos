import { Env } from '../types';

export interface PaymentTransaction {
  id: string;
  transaction_id: string;
  order_id?: string;
  amount: number;
  currency: string;
  payment_method: string;
  gateway: string;
  status: string;
  gateway_transaction_id?: string;
  gateway_response?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentRefund {
  id: string;
  payment_transaction_id: string;
  refund_amount: number;
  reason?: string;
  status: string;
  gateway_refund_id?: string;
  created_at?: string;
}

export interface CreatePaymentData {
  order_id?: string;
  amount: number;
  currency?: string;
  payment_method: string;
  gateway: string;
  gateway_transaction_id?: string;
  gateway_response?: string;
}

export interface CreateRefundData {
  payment_transaction_id: string;
  refund_amount: number;
  reason?: string;
  gateway_refund_id?: string;
}

export class PaymentService_PaymentsManagementtsx {
  constructor(private env: Env) {}

  async getPayments(
    tenantId: string,
    page: number = 1,
    limit: number = 50,
    status?: string,
    paymentMethod?: string,
    startDate?: string,
    endDate?: string
  ) {
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT
          pt.*,
          o.order_number,
          o.customer_name
        FROM payment_transactions pt
        LEFT JOIN orders o ON pt.order_id = o.id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (status) {
        query += ` AND pt.status = ?`;
        params.push(status);
      }

      if (paymentMethod) {
        query += ` AND pt.payment_method = ?`;
        params.push(paymentMethod);
      }

      if (startDate) {
        query += ` AND pt.created_at >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND pt.created_at <= ?`;
        params.push(endDate);
      }

      query += ` ORDER BY pt.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const payments = await this.env.DB.prepare(query).bind(...params).all();

      // Count total
      let countQuery = `SELECT COUNT(*) as total FROM payment_transactions WHERE 1=1`;
      const countParams: any[] = [];

      if (status) {
        countQuery += ` AND status = ?`;
        countParams.push(status);
      }

      if (paymentMethod) {
        countQuery += ` AND payment_method = ?`;
        countParams.push(paymentMethod);
      }

      if (startDate) {
        countQuery += ` AND created_at >= ?`;
        countParams.push(startDate);
      }

      if (endDate) {
        countQuery += ` AND created_at <= ?`;
        countParams.push(endDate);
      }

      const countResult = await this.env.DB.prepare(countQuery).bind(...countParams).first();

      return {
        success: true,
        payments: payments.results || [],
        data: payments.results || [],
        pagination: {
          page,
          limit,
          total: Number((countResult as any)?.total) || 0,
          pages: Math.ceil((Number((countResult as any)?.total) || 0) / limit)
        }
      };
    } catch (error: any) {
      console.error('Get payments error:', error);
      return { success: false, error: error.message || 'Lỗi khi tải danh sách thanh toán' };
    }
  }

  async getPaymentById(paymentId: string, tenantId?: string) {
    try {
      const payment = await this.env.DB.prepare(`
        SELECT
          pt.*,
          o.order_number,
          o.customer_name,
          o.customer_phone
        FROM payment_transactions pt
        LEFT JOIN orders o ON pt.order_id = o.id
        WHERE pt.id = ?
      `).bind(paymentId).first();

      if (!payment) {
        return { success: false, error: 'Không tìm thấy giao dịch thanh toán' };
      }

      // Get refunds for this payment
      const refunds = await this.env.DB.prepare(`
        SELECT * FROM payment_refunds WHERE payment_transaction_id = ?
        ORDER BY created_at DESC
      `).bind(paymentId).all();

      return {
        success: true,
        payment: {
          ...payment,
          refunds: refunds.results || []
        },
        data: {
          ...payment,
          refunds: refunds.results || []
        }
      };
    } catch (error: any) {
      console.error('Get payment error:', error);
      return { success: false, error: error.message || 'Lỗi khi tải giao dịch thanh toán' };
    }
  }

  async createPayment(data: CreatePaymentData) {
    try {
      const paymentId = `payment_${Date.now()}`;
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        INSERT INTO payment_transactions (
          id, transaction_id, order_id, amount, currency,
          payment_method, gateway, status, gateway_transaction_id,
          gateway_response, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        paymentId,
        transactionId,
        data.order_id || null,
        data.amount,
        data.currency || 'VND',
        data.payment_method,
        data.gateway,
        'pending',
        data.gateway_transaction_id || null,
        data.gateway_response || null,
        now,
        now
      ).run();

      // Update order payment status if order_id exists
      if (data.order_id) {
        await this.env.DB.prepare(`
          UPDATE orders
          SET payment_status = 'processing', updated_at = ?
          WHERE id = ?
        `).bind(now, data.order_id).run();
      }

      return {
        success: true,
        payment_id: paymentId,
        transaction_id: transactionId,
        message: 'Tạo giao dịch thanh toán thành công'
      };
    } catch (error: any) {
      console.error('Create payment error:', error);
      return { success: false, error: error.message || 'Lỗi khi tạo giao dịch thanh toán' };
    }
  }

  async updatePaymentStatus(
    paymentId: string,
    status: string,
    gatewayTransactionId?: string,
    gatewayResponse?: string
  ) {
    try {
      const now = new Date().toISOString();

      // Get current payment
      const payment = await this.env.DB.prepare(`
        SELECT * FROM payment_transactions WHERE id = ?
      `).bind(paymentId).first();

      if (!payment) {
        return { success: false, error: 'Không tìm thấy giao dịch thanh toán' };
      }

      // Update payment status
      await this.env.DB.prepare(`
        UPDATE payment_transactions
        SET status = ?, gateway_transaction_id = ?, gateway_response = ?, updated_at = ?
        WHERE id = ?
      `).bind(
        status,
        gatewayTransactionId || payment.gateway_transaction_id,
        gatewayResponse || payment.gateway_response,
        now,
        paymentId
      ).run();

      // Update order payment status if payment is completed
      if (status === 'completed' && payment.order_id) {
        await this.env.DB.prepare(`
          UPDATE orders
          SET payment_status = 'completed', updated_at = ?
          WHERE id = ?
        `).bind(now, payment.order_id).run();
      } else if (status === 'failed' && payment.order_id) {
        await this.env.DB.prepare(`
          UPDATE orders
          SET payment_status = 'failed', updated_at = ?
          WHERE id = ?
        `).bind(now, payment.order_id).run();
      }

      return {
        success: true,
        message: 'Cập nhật trạng thái thanh toán thành công'
      };
    } catch (error: any) {
      console.error('Update payment status error:', error);
      return { success: false, error: error.message || 'Lỗi khi cập nhật trạng thái thanh toán' };
    }
  }

  async createRefund(tenantId: string, userId: string, data: any) {
    try {
      const refundId = `refund_${Date.now()}`;
      const now = new Date().toISOString();

      // Get payment transaction
      const payment = await this.env.DB.prepare(`
        SELECT * FROM payment_transactions WHERE id = ?
      `).bind(data.payment_transaction_id).first();

      if (!payment) {
        return { success: false, error: 'Không tìm thấy giao dịch thanh toán' };
      }

      // Check if payment is completed
      if (payment.status !== 'completed') {
        return { success: false, error: 'Chỉ có thể hoàn tiền cho giao dịch đã hoàn tất' };
      }

      // Check refund amount
      if (data.refund_amount > payment.amount) {
        return { success: false, error: 'Số tiền hoàn vượt quá số tiền giao dịch' };
      }

      // Create refund record
      await this.env.DB.prepare(`
        INSERT INTO payment_refunds (
          id, payment_transaction_id, refund_amount, reason,
          status, gateway_refund_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        refundId,
        data.payment_transaction_id,
        data.refund_amount,
        data.reason || null,
        'pending',
        data.gateway_refund_id || null,
        now
      ).run();

      return {
        success: true,
        refund_id: refundId,
        message: 'Tạo yêu cầu hoàn tiền thành công'
      };
    } catch (error: any) {
      console.error('Create refund error:', error);
      return { success: false, error: error.message || 'Lỗi khi tạo yêu cầu hoàn tiền' };
    }
  }

  async updateRefundStatus(refundId: string, status: string, gatewayRefundId?: string) {
    try {
      const now = new Date().toISOString();

      await this.env.DB.prepare(`
        UPDATE payment_refunds
        SET status = ?, gateway_refund_id = ?
        WHERE id = ?
      `).bind(status, gatewayRefundId || null, refundId).run();

      return {
        success: true,
        message: 'Cập nhật trạng thái hoàn tiền thành công'
      };
    } catch (error: any) {
      console.error('Update refund status error:', error);
      return { success: false, error: error.message || 'Lỗi khi cập nhật trạng thái hoàn tiền' };
    }
  }

  async getPaymentStats(tenantId: string, startDate?: string, endDate?: string) {
    try {
      let query = `
        SELECT
          COUNT(*) as total_transactions,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_transactions,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_transactions,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_transactions
        FROM payment_transactions
        WHERE 1=1
      `;

      const params: any[] = [];

      if (startDate) {
        query += ` AND created_at >= ?`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND created_at <= ?`;
        params.push(endDate);
      }

      const stats = await this.env.DB.prepare(query).bind(...params).first();

      // Get payment methods breakdown
      let methodQuery = `
        SELECT
          payment_method,
          COUNT(*) as count,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount
        FROM payment_transactions
        WHERE status = 'completed'
      `;

      const methodParams: any[] = [];

      if (startDate) {
        methodQuery += ` AND created_at >= ?`;
        methodParams.push(startDate);
      }

      if (endDate) {
        methodQuery += ` AND created_at <= ?`;
        methodParams.push(endDate);
      }

      methodQuery += ` GROUP BY payment_method`;

      const methodStats = await this.env.DB.prepare(methodQuery).bind(...methodParams).all();

      return {
        success: true,
        stats: {
          ...stats,
          payment_methods: methodStats.results || []
        }
      };
    } catch (error: any) {
      console.error('Get payment stats error:', error);
      return { success: false, error: error.message || 'Lỗi khi tải thống kê thanh toán' };
    }
  }

  async getRefunds(
    tenantId: string,
    page: number = 1,
    limit: number = 50,
    status?: string
  ) {
    try {
      const offset = (page - 1) * limit;
      let query = `
        SELECT
          pr.*,
          pt.transaction_id,
          pt.payment_method,
          pt.order_id,
          o.order_number
        FROM payment_refunds pr
        LEFT JOIN payment_transactions pt ON pr.payment_transaction_id = pt.id
        LEFT JOIN orders o ON pt.order_id = o.id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (status) {
        query += ` AND pr.status = ?`;
        params.push(status);
      }

      query += ` ORDER BY pr.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const refunds = await this.env.DB.prepare(query).bind(...params).all();

      // Count total
      let countQuery = `SELECT COUNT(*) as total FROM payment_refunds WHERE 1=1`;
      const countParams: any[] = [];

      if (status) {
        countQuery += ` AND status = ?`;
        countParams.push(status);
      }

      const countResult = await this.env.DB.prepare(countQuery).bind(...countParams).first();

      return {
        success: true,
        refunds: refunds.results || [],
        pagination: {
          page,
          limit,
          total: Number((countResult as any)?.total) || 0,
          pages: Math.ceil((Number((countResult as any)?.total) || 0) / limit)
        }
      };
    } catch (error: any) {
      console.error('Get refunds error:', error);
      return { success: false, error: error.message || 'Lỗi khi tải danh sách hoàn tiền' };
    }
  }

  async createMoMoPayment(tenantId: string, orderId: string, userId: string, data: any) {
    try {
      const paymentData: CreatePaymentData = {
        order_id: orderId,
        amount: data.amount,
        currency: 'VND',
        payment_method: 'momo',
        gateway: 'momo',
        gateway_transaction_id: data.gateway_transaction_id,
        gateway_response: JSON.stringify(data.gateway_response || {})
      };
      return await this.createPayment(paymentData);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async createVNPayPayment(tenantId: string, orderId: string, userId: string, data: any) {
    try {
      const paymentData: CreatePaymentData = {
        order_id: orderId,
        amount: data.amount,
        currency: 'VND',
        payment_method: 'vnpay',
        gateway: 'vnpay',
        gateway_transaction_id: data.gateway_transaction_id,
        gateway_response: JSON.stringify(data.gateway_response || {})
      };
      return await this.createPayment(paymentData);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateMoMoPayment(paymentId: string, data: any) {
    try {
      return await this.updatePaymentStatus(paymentId, data.status || 'pending', data.gateway_transaction_id, data.gateway_response);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateVNPayPayment(paymentId: string, data: any) {
    try {
      return await this.updatePaymentStatus(paymentId, data.status || 'pending', data.gateway_transaction_id, data.gateway_response);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
