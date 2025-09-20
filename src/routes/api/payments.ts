import { Hono } from 'hono';
import { Env } from '../../types';
import { MoMoService, MoMoConfig } from '../../services/MoMoService';

const app = new Hono<{ Bindings: Env }>();

// Validate payment gateway configs
function validatePaymentConfig(env: Env, gateway?: string) {
  const errors: string[] = [];

  // Validate specific gateway or all if not specified
  if (!gateway || gateway === 'vnpay') {
    if (!env.VNPAY_TMN_CODE) errors.push('VNPAY_TMN_CODE is required');
    if (!env.VNPAY_HASH_SECRET) errors.push('VNPAY_HASH_SECRET is required');
  }

  if (!gateway || gateway === 'momo') {
    if (!env.MOMO_PARTNER_CODE) errors.push('MOMO_PARTNER_CODE is required');
    if (!env.MOMO_ACCESS_KEY) errors.push('MOMO_ACCESS_KEY is required');
    if (!env.MOMO_SECRET_KEY) errors.push('MOMO_SECRET_KEY is required');
  }

  if (!gateway || gateway === 'zalopay') {
    if (!env.ZALOPAY_APP_ID) errors.push('ZALOPAY_APP_ID is required');
    if (!env.ZALOPAY_KEY1) errors.push('ZALOPAY_KEY1 is required');
    if (!env.ZALOPAY_KEY2) errors.push('ZALOPAY_KEY2 is required');
  }

  if (errors.length > 0) {
    throw new Error(`Payment gateway configuration missing: ${errors.join(', ')}`);
  }
}

// Create VNPay HMAC-SHA512 signature
async function createVNPaySignature(params: Record<string, string>, secretKey: string): Promise<string> {
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // Create HMAC-SHA512 signature
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(sortedParams);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Simple test endpoint
app.get('/', async (c: any) => {
  return c.json({
    success: true,
    data: [],
    message: 'Payments endpoint working - iframe/widget approach'
  });
});

// VNPay Payment Integration - Real HMAC-SHA512 Implementation
app.post('/vnpay/create', async (c: any) => {
  try {
    // Validate ENV config first
    validatePaymentConfig(c.env, 'vnpay');

    const { saleId, amount, orderInfo } = await c.req.json();

    if (!saleId || !amount) {
      return c.json({ success: false, error: 'Sale ID and amount are required' }, 400);
    }

    // Generate transaction ID for tracking
    const transactionId = `VNPAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // VNPay parameters
    const vnpayParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: c.env.VNPAY_TMN_CODE || '',
      vnp_Amount: (amount * 100).toString(), // VNPay uses amount in cents
      vnp_CurrCode: 'VND',
      vnp_TxnRef: transactionId,
      vnp_OrderInfo: orderInfo || `Thanh toán đơn hàng #${saleId}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: 'https://namhbcf-uk.pages.dev/payment/success',
      vnp_IpAddr: c.req.header('CF-Connecting-IP') || '127.0.0.1',
      vnp_CreateDate: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    };

    // Create HMAC-SHA512 signature
    const signature = await createVNPaySignature(vnpayParams, c.env.VNPAY_HASH_SECRET || '');

    // Add signature to parameters
    const finalParams = { ...vnpayParams, vnp_SecureHash: signature };

    // Create payment URL
    const paymentUrl = `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?${new URLSearchParams(finalParams).toString()}`;

    // Store transaction in database for tracking
    await c.env.DB.prepare(`
      INSERT INTO payment_transactions (
        id, order_id, transaction_id, amount, currency, payment_method, gateway,
        status, gateway_transaction_id, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      crypto.randomUUID(),
      saleId,
      transactionId,
      amount,
      'VND',
      'vnpay',
      'vnpay',
      'pending',
      transactionId
    ).run();

    return c.json({
      success: true,
      data: {
        transactionId,
        paymentMethod: 'vnpay',
        paymentUrl,
        qrCode: paymentUrl // For QR code generation
      }
    });
  } catch (error) {
    console.error('VNPay create payment error:', error);
    if (error instanceof Error && error.message.includes('configuration missing')) {
      return c.json({ success: false, error: error.message }, 400);
    }
    return c.json({ success: false, error: 'Failed to create VNPay payment' }, 500);
  }
});

// MoMo Payment Integration - Real HMAC-SHA256 Implementation
app.post('/momo/create', async (c: any) => {
  try {
    // Validate ENV config first
    validatePaymentConfig(c.env, 'momo');

    const { saleId, amount, orderInfo } = await c.req.json();

    if (!saleId || !amount) {
      return c.json({ success: false, error: 'Sale ID and amount are required' }, 400);
    }

    // Generate transaction ID for tracking
    const transactionId = `MOMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Configure MoMo service with real ENV values
    const momoConfig: MoMoConfig = {
      partnerCode: c.env.MOMO_PARTNER_CODE || '',
      accessKey: c.env.MOMO_ACCESS_KEY || '',
      secretKey: c.env.MOMO_SECRET_KEY || '',
      endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
      returnUrl: 'https://namhbcf-uk.pages.dev/payment/success',
      notifyUrl: 'https://namhbcf-api.bangachieu2.workers.dev/api/v1/payments/momo/callback'
    };

    const momoService = new MoMoService(momoConfig);

    // Create MoMo payment
    const momoResponse = await momoService.createPayment({
      orderId: transactionId,
      amount: amount,
      orderInfo: orderInfo || `Thanh toán đơn hàng #${saleId}`
    });

    // Store transaction in database for tracking
    await c.env.DB.prepare(`
      INSERT INTO payment_transactions (
        id, order_id, transaction_id, amount, currency, payment_method, gateway,
        status, gateway_transaction_id, gateway_response, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      crypto.randomUUID(),
      saleId,
      transactionId,
      amount,
      'VND',
      'momo',
      'momo',
      momoResponse.resultCode === 0 ? 'pending' : 'failed',
      momoResponse.requestId,
      JSON.stringify(momoResponse)
    ).run();

    if (momoResponse.resultCode === 0) {
      return c.json({
        success: true,
        data: {
          transactionId,
          paymentMethod: 'momo',
          paymentUrl: momoResponse.payUrl,
          qrCodeUrl: momoResponse.qrCodeUrl,
          deeplink: momoResponse.deeplink
        }
      });
    } else {
      return c.json({
        success: false,
        error: momoResponse.message,
        data: { resultCode: momoResponse.resultCode }
      }, 400);
    }
  } catch (error) {
    console.error('MoMo create payment error:', error);
    if (error instanceof Error && error.message.includes('configuration missing')) {
      return c.json({ success: false, error: error.message }, 400);
    }
    return c.json({ success: false, error: 'Failed to create MoMo payment' }, 500);
  }
});

// ZaloPay Payment Integration - Iframe/Widget Approach
app.post('/zalopay/create', async (c: any) => {
  try {
    const { saleId, amount, orderInfo } = await c.req.json();

    if (!saleId || !amount) {
      return c.json({ success: false, error: 'Sale ID and amount are required' }, 400);
    }

    // Generate transaction ID for tracking
    const transactionId = `ZALOPAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store transaction in database for tracking
    await c.env.DB.prepare(`
      INSERT INTO payment_transactions (
        id, sale_id, transaction_id, amount, currency, payment_method,
        status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      crypto.randomUUID(),
      saleId,
      transactionId,
      amount,
      'VND',
      'zalopay',
      'pending'
    ).run();

    // Return iframe URL và widget config
    return c.json({
      success: true,
      data: {
        transactionId,
        paymentMethod: 'zalopay',
        iframeUrl: 'https://zalopay.vn/pay',
        widgetConfig: {
          amount,
          orderId: saleId,
          description: orderInfo || `Thanh toán đơn hàng #${saleId}`,
          returnUrl: 'https://namhbcf-uk.pages.dev/payment/success',
          cancelUrl: 'https://namhbcf-uk.pages.dev/payment/cancel'
        },
        qrCodeUrl: `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=zalopay://payment?amount=${amount}&note=${encodeURIComponent(orderInfo || '')}`,
        instructions: 'Sử dụng iframe ZaloPay widget hoặc QR code cho thanh toán'
      }
    });
  } catch (error) {
    console.error('ZaloPay create payment error:', error);
    return c.json({ success: false, error: 'Failed to create ZaloPay payment' }, 500);
  }
});

// Payment status check - Manual update approach
app.post('/status/:transactionId', async (c: any) => {
  try {
    const transactionId = c.req.param('transactionId');
    const { status } = await c.req.json(); // Manual status update from frontend

    if (!transactionId || !status) {
      return c.json({ success: false, error: 'Transaction ID and status are required' }, 400);
    }

    // Update transaction status
    await c.env.DB.prepare(`
      UPDATE payment_transactions
      SET status = ?, updated_at = datetime('now')
      WHERE transaction_id = ?
    `).bind(status, transactionId).run();

    return c.json({
      success: true,
      data: {
        transactionId,
        status,
        message: 'Payment status updated successfully'
      }
    });
  } catch (error) {
    console.error('Payment status update error:', error);
    return c.json({ success: false, error: 'Failed to update payment status' }, 500);
  }
});

// Get payment transactions
app.get('/transactions', async (c: any) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM payment_transactions
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    return c.json({
      success: true,
      data: results || []
    });
  } catch (error) {
    console.error('Get payment transactions error:', error);
    return c.json({ success: false, error: 'Failed to get payment transactions' }, 500);
  }
});

export default app;