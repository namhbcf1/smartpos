/**
 * Payment Routes - Xử lý thanh toán cho ComputerPOS Pro
 * Hỗ trợ VNPay, MoMo, ZaloPay và các phương thức thanh toán Việt Nam
 */

import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { VNPayService } from '../services/VNPayService';
import { MoMoService } from '../services/MoMoService';

const payments = new Hono();

/**
 * POST /payments/vnpay/create
 * Tạo thanh toán VNPay
 */
payments.post('/vnpay/create', authenticate, async (c) => {
  try {
    const { saleId, amount, orderInfo, customerInfo } = await c.req.json();

    // Validate input
    if (!saleId || !amount || amount <= 0) {
      return c.json({
        success: false,
        message: 'Thông tin thanh toán không hợp lệ'
      }, 400);
    }

    // Tạo VNPay service
    const vnpayConfig = {
      vnp_TmnCode: c.env.VNPAY_TMN_CODE || 'VNPAY_SANDBOX',
      vnp_HashSecret: c.env.VNPAY_HASH_SECRET || 'VNPAY_SECRET_KEY',
      vnp_Url: c.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      vnp_ReturnUrl: `${c.env.FRONTEND_URL}/payment/callback`,
      vnp_IpnUrl: `${c.env.API_URL}/api/v1/payments/vnpay/ipn`
    };

    const vnpayService = new VNPayService(vnpayConfig);

    // Tạo transaction ID
    const transactionId = `VNPAY_${saleId}_${Date.now()}`;

    // Tạo payment request
    const paymentRequest = {
      orderId: transactionId,
      amount: amount,
      orderInfo: orderInfo || `Thanh toán đơn hàng #${saleId}`,
      customerInfo: customerInfo
    };

    const vnpayResponse = await vnpayService.createPayment(paymentRequest);

    // Lưu transaction vào database
    const insertResult = await c.env.DB.prepare(`
      INSERT INTO payment_transactions 
      (sale_id, transaction_id, payment_method, amount, status, gateway_response)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      saleId,
      transactionId,
      'vnpay',
      amount,
      'pending',
      JSON.stringify(vnpayResponse)
    ).run();

    // Lưu QR code nếu có
    if (vnpayResponse.qrCode) {
      await c.env.DB.prepare(`
        INSERT INTO qr_payments 
        (qr_code, payment_transaction_id, expires_at)
        VALUES (?, ?, ?)
      `).bind(
        vnpayResponse.qrCode,
        insertResult.meta.last_row_id,
        new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 phút
      ).run();
    }

    return c.json({
      success: true,
      data: {
        transactionId,
        paymentUrl: vnpayResponse.paymentUrl,
        qrCode: vnpayResponse.qrCode
      }
    });

  } catch (error) {
    console.error('VNPay payment creation error:', error);
    return c.json({
      success: false,
      message: 'Không thể tạo thanh toán VNPay',
      error: error.message
    }, 500);
  }
});

/**
 * POST /payments/vnpay/callback
 * Xử lý callback từ VNPay
 */
payments.post('/vnpay/callback', async (c) => {
  try {
    const callbackData = await c.req.json();

    const vnpayConfig = {
      vnp_TmnCode: c.env.VNPAY_TMN_CODE || 'VNPAY_SANDBOX',
      vnp_HashSecret: c.env.VNPAY_HASH_SECRET || 'VNPAY_SECRET_KEY',
      vnp_Url: c.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      vnp_ReturnUrl: `${c.env.FRONTEND_URL}/payment/callback`,
      vnp_IpnUrl: `${c.env.API_URL}/api/v1/payments/vnpay/ipn`
    };

    const vnpayService = new VNPayService(vnpayConfig);

    // Xác thực callback
    const isValid = await vnpayService.verifyCallback(callbackData);
    
    if (!isValid) {
      return c.json({
        success: false,
        message: 'Chữ ký không hợp lệ'
      }, 400);
    }

    const transactionId = callbackData.vnp_TxnRef;
    const responseCode = callbackData.vnp_ResponseCode;
    const isSuccess = vnpayService.isPaymentSuccessful(responseCode);

    // Cập nhật trạng thái transaction
    const newStatus = isSuccess ? 'completed' : 'failed';
    
    await c.env.DB.prepare(`
      UPDATE payment_transactions 
      SET status = ?, gateway_transaction_id = ?, gateway_response = ?, updated_at = CURRENT_TIMESTAMP
      WHERE transaction_id = ?
    `).bind(
      newStatus,
      callbackData.vnp_TransactionNo,
      JSON.stringify(callbackData),
      transactionId
    ).run();

    // Nếu thanh toán thành công, cập nhật trạng thái sale
    if (isSuccess) {
      const saleId = transactionId.split('_')[1];
      await c.env.DB.prepare(`
        UPDATE sales 
        SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(saleId).run();
    }

    return c.json({
      success: true,
      data: {
        transactionId,
        status: newStatus,
        message: isSuccess ? 'Thanh toán thành công' : vnpayService.getErrorMessage(responseCode)
      }
    });

  } catch (error) {
    console.error('VNPay callback error:', error);
    return c.json({
      success: false,
      message: 'Lỗi xử lý callback VNPay'
    }, 500);
  }
});

/**
 * POST /payments/momo/create
 * Tạo thanh toán MoMo
 */
payments.post('/momo/create', authenticate, async (c) => {
  try {
    const { saleId, amount, orderInfo } = await c.req.json();

    if (!saleId || !amount || amount <= 0) {
      return c.json({
        success: false,
        message: 'Thông tin thanh toán không hợp lệ'
      }, 400);
    }

    const momoConfig = {
      partnerCode: c.env.MOMO_PARTNER_CODE || 'MOMO_PARTNER',
      accessKey: c.env.MOMO_ACCESS_KEY || 'MOMO_ACCESS_KEY',
      secretKey: c.env.MOMO_SECRET_KEY || 'MOMO_SECRET_KEY',
      endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
      returnUrl: `${c.env.FRONTEND_URL}/payment/callback`,
      notifyUrl: `${c.env.API_URL}/api/v1/payments/momo/ipn`
    };

    const momoService = new MoMoService(momoConfig);
    const transactionId = `MOMO_${saleId}_${Date.now()}`;

    const paymentRequest = {
      orderId: transactionId,
      amount: amount,
      orderInfo: orderInfo || `Thanh toán đơn hàng #${saleId}`
    };

    const momoResponse = await momoService.createPayment(paymentRequest);

    // Lưu transaction
    const insertResult = await c.env.DB.prepare(`
      INSERT INTO payment_transactions 
      (sale_id, transaction_id, payment_method, amount, status, gateway_response)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      saleId,
      transactionId,
      'momo',
      amount,
      momoResponse.resultCode === 0 ? 'pending' : 'failed',
      JSON.stringify(momoResponse)
    ).run();

    return c.json({
      success: true,
      data: {
        transactionId,
        paymentUrl: momoResponse.payUrl,
        qrCode: momoResponse.qrCodeUrl,
        deeplink: momoResponse.deeplink
      }
    });

  } catch (error) {
    console.error('MoMo payment creation error:', error);
    return c.json({
      success: false,
      message: 'Không thể tạo thanh toán MoMo',
      error: error.message
    }, 500);
  }
});

/**
 * GET /payments/status/:transactionId
 * Kiểm tra trạng thái thanh toán
 */
payments.get('/status/:transactionId', authenticate, async (c) => {
  try {
    const transactionId = c.req.param('transactionId');

    const transaction = await c.env.DB.prepare(`
      SELECT pt.*, s.total_amount, s.payment_status as sale_payment_status
      FROM payment_transactions pt
      LEFT JOIN sales s ON pt.sale_id = s.id
      WHERE pt.transaction_id = ?
    `).bind(transactionId).first();

    if (!transaction) {
      return c.json({
        success: false,
        message: 'Không tìm thấy giao dịch'
      }, 404);
    }

    return c.json({
      success: true,
      data: {
        transactionId: transaction.transaction_id,
        paymentMethod: transaction.payment_method,
        amount: transaction.amount,
        status: transaction.status,
        salePaymentStatus: transaction.sale_payment_status,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return c.json({
      success: false,
      message: 'Lỗi kiểm tra trạng thái thanh toán'
    }, 500);
  }
});

export default payments;
