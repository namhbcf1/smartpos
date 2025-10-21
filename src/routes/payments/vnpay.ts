import { Hono } from 'hono';
import { Env } from '../../types';
import { VNPayService } from '../../services/VNPayService';
import { createSuccessResponse, createErrorResponse } from '../../utils/api-response';

const app = new Hono<{ Bindings: Env }>();

// POST /api/payments/vnpay/create-pay-url - Tạo URL thanh toán PAY (vnp_Command = pay)
app.post('/create-pay-url', async (c) => {
  try {
    const body = await c.req.json();
    const { 
      orderId,
      amount,
      orderDescription,
      bankCode,
      locale,
      ipAddress,
      currency,
      returnUrl,
      expireDate,
      orderType,
      billing,
      invoice
    } = body;

    if (!orderId || !amount || !orderDescription) {
      return c.json(createErrorResponse(
        'Missing required fields: orderId, amount, orderDescription',
        [],
        400
      ), 400);
    }

    const vnpayService = new VNPayService(c.env);
    
    const result = await vnpayService.createPayUrl({
      orderId,
      amount,
      orderDescription,
      bankCode,
      locale: locale || 'vn',
      ipAddress: ipAddress || c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1',
      currency: currency || 'VND',
      returnUrl: returnUrl || `${c.env.FRONTEND_URL}/payment/vnpay-return`,
      expireDate,
      orderType: orderType || 'other',
      billing,
      invoice
    });

    if (!result.success) {
      return c.json(createErrorResponse(
        result.error || 'Failed to create payment URL',
        [],
        400
      ), 400);
    }

    return c.json(createSuccessResponse({
      paymentUrl: result.paymentUrl,
      debug: result.debug
    }, 'Payment URL created successfully'));

  } catch (error: any) {
    console.error('Error creating payment URL:', error);
    return c.json(createErrorResponse(
      'Internal server error',
      [],
      500
    ), 500);
  }
});

// POST /api/payments/vnpay/create-payment-url (cũ - giữ lại để tương thích)
app.post('/create-payment-url', async (c) => {
  try {
    const body = await c.req.json();
    const { 
      orderId, 
      amount, 
      orderDescription, 
      bankCode, 
      ipAddress,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress
    } = body;

    // Validate required fields
    if (!orderId || !amount || !orderDescription) {
      return c.json(createErrorResponse(
        'Missing required fields: orderId, amount, orderDescription',
        [],
        400
      ), 400);
    }

    const vnpayService = new VNPayService(c.env);
    
    const result = await vnpayService.createPaymentUrl({
      orderId,
      amount: parseFloat(amount),
      orderDescription,
      bankCode,
      ipAddress: ipAddress || c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1',
      customerName: customerName || 'Khách hàng',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      customerAddress: customerAddress || ''
    });

    if (!result.success) {
      return c.json(createErrorResponse(
        result.error || 'Failed to create payment URL',
        [],
        500
      ), 500);
    }

    return c.json(createSuccessResponse({
      paymentUrl: result.paymentUrl,
      orderId,
      amount
    }, 'Payment URL created successfully'));

  } catch (error: any) {
    console.error('Create VNPay payment URL error:', error);
    return c.json(createErrorResponse(
      'Internal server error',
      [],
      500
    ), 500);
  }
});

// GET /api/payments/vnpay/return - VNPay Return URL
// GET /pay-return - Xử lý return URL từ VNPay cho PAY operations
app.get('/pay-return', async (c) => {
  try {
    const queryParams = c.req.query();
    
    const vnpayService = new VNPayService(c.env);
    const verification = await vnpayService.verifyPayReturnData(queryParams);
    
    if (!verification.isValid) {
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lỗi xác thực VNPay</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Lỗi xác thực giao dịch</h2>
            <p>${verification.error}</p>
            <p>Vui lòng liên hệ hỗ trợ nếu vấn đề tiếp tục xảy ra.</p>
          </div>
        </body>
        </html>
      `);
    }

    const paymentData = verification.paymentData;
    const isSuccess = paymentData.vnp_ResponseCode === '00' && paymentData.vnp_TransactionStatus === '00';
    
    if (isSuccess) {
      // TODO: Update order status in database
      // TODO: Create payment record
      
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Thanh toán thành công</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #2e7d32; background: #e8f5e8; padding: 20px; border-radius: 8px; }
            .payment-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="success">
            <h2>✅ Thanh toán thành công!</h2>
            <p>Giao dịch đã được xử lý thành công.</p>
            <div class="payment-info">
              <p><strong>Mã giao dịch:</strong> ${paymentData.vnp_TransactionNo}</p>
              <p><strong>Số tiền:</strong> ${(parseInt(paymentData.vnp_Amount) / 100).toLocaleString('vi-VN')} VND</p>
              <p><strong>Mã tham chiếu:</strong> ${paymentData.vnp_TxnRef}</p>
              <p><strong>Thời gian:</strong> ${paymentData.vnp_PayDate}</p>
            </div>
            <p>Bạn có thể đóng cửa sổ này.</p>
          </div>
        </body>
        </html>
      `);
    } else {
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Thanh toán thất bại</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Thanh toán thất bại</h2>
            <p>Mã lỗi: ${paymentData.vnp_ResponseCode}</p>
            <p>Trạng thái: ${paymentData.vnp_TransactionStatus}</p>
            <p>Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
          </div>
        </body>
        </html>
      `);
    }

  } catch (error: any) {
    console.error('Error processing payment return:', error);
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lỗi hệ thống</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>❌ Lỗi hệ thống</h2>
          <p>Đã xảy ra lỗi khi xử lý giao dịch.</p>
          <p>Vui lòng liên hệ hỗ trợ.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// GET /return - Xử lý return URL từ VNPay (cũ - giữ lại để tương thích)
app.get('/return', async (c) => {
  try {
    const url = new URL(c.req.url);
    const params: any = {};
    
    // Extract all VNPay parameters
    for (const [key, value] of url.searchParams.entries()) {
      params[key] = value;
    }

    const vnpayService = new VNPayService(c.env);
    
    // Verify the return data
    const verification = await vnpayService.verifyReturnData(params);
    
    if (!verification.isValid) {
      console.error('VNPay return verification failed:', verification.error);
      return c.redirect(`${c.env.FRONTEND_URL}/payment/vnpay-return?status=error&message=${encodeURIComponent(verification.error || 'Verification failed')}`);
    }

    const {
      vnp_ResponseCode,
      vnp_TransactionStatus,
      vnp_TxnRef,
      vnp_Amount,
      vnp_TransactionNo,
      vnp_OrderInfo
    } = params;

    // Check if payment is successful
    const isSuccess = vnp_ResponseCode === '00' && vnp_TransactionStatus === '00';

    // Redirect to frontend with result
    const redirectUrl = isSuccess 
      ? `${c.env.FRONTEND_URL}/payment/vnpay-return?status=success&orderId=${vnp_TxnRef}&amount=${vnp_Amount}&transactionNo=${vnp_TransactionNo}`
      : `${c.env.FRONTEND_URL}/payment/vnpay-return?status=failed&orderId=${vnp_TxnRef}&responseCode=${vnp_ResponseCode}&message=${encodeURIComponent('Payment failed')}`;

    return c.redirect(redirectUrl);

  } catch (error: any) {
    console.error('VNPay return processing error:', error);
    return c.redirect(`${c.env.FRONTEND_URL}/payment/vnpay-return?status=error&message=${encodeURIComponent('Internal server error')}`);
  }
});

// POST /api/payments/vnpay/ipn - VNPay IPN URL
// POST /pay-ipn - Xử lý IPN từ VNPay cho PAY operations
app.post('/pay-ipn', async (c) => {
  try {
    const body = await c.req.json();
    
    const vnpayService = new VNPayService(c.env);
    const result = await vnpayService.processPayIPN(body);
    
    if (!result.success) {
      return c.json(result.response || { RspCode: '99', Message: 'Internal error' }, 200);
    }

    // TODO: Update database with payment status
    // This should be implemented with proper database operations
    
    return c.json(result.response || { RspCode: '00', Message: 'success' }, 200);

  } catch (error: any) {
    console.error('Error processing PAY IPN:', error);
    return c.json({ RspCode: '99', Message: 'Internal error' }, 200);
  }
});

// POST /ipn - Xử lý IPN từ VNPay (cũ - giữ lại để tương thích)
app.post('/ipn', async (c) => {
  try {
    const body = await c.req.json();
    
    const vnpayService = new VNPayService(c.env);
    
    // Process IPN
    const result = await vnpayService.processIPN(body, c.env);
    
    if (!result.success) {
      console.error('VNPay IPN processing failed:', result.error);
      return c.json({ RspCode: '99', Message: result.error || 'Processing failed' }, 200);
    }

    return c.json({ RspCode: '00', Message: 'Success' }, 200);

  } catch (error: any) {
    console.error('VNPay IPN error:', error);
    return c.json({ RspCode: '99', Message: 'Internal server error' }, 200);
  }
});

// GET /api/payments/vnpay/query/:orderId - Query transaction status
app.get('/query/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    
    if (!orderId) {
      return c.json(createErrorResponse(
        'Order ID is required',
        [],
        400
      ), 400);
    }

    const vnpayService = new VNPayService(c.env);
    
    const result = await vnpayService.queryTransaction(orderId, c.env);
    
    if (!result.success) {
      return c.json(createErrorResponse(
        result.error || 'Failed to query transaction',
        [],
        500
      ), 500);
    }

    return c.json(createSuccessResponse(result.data, 'Transaction queried successfully'));

  } catch (error: any) {
    console.error('VNPay query transaction error:', error);
    return c.json(createErrorResponse(
      'Internal server error',
      [],
      500
    ), 500);
  }
});

// GET /api/payments/vnpay/banks - Get available banks
app.get('/banks', async (c) => {
  const banks = [
    { code: 'VNPAYQR', name: 'Thanh toán quét mã QR VNPay' },
    { code: 'VNBANK', name: 'Thẻ ATM - Tài khoản ngân hàng nội địa' },
    { code: 'INTCARD', name: 'Thẻ thanh toán quốc tế' },
    { code: 'VIETCOMBANK', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam' },
    { code: 'VIETINBANK', name: 'Ngân hàng TMCP Công Thương Việt Nam' },
    { code: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
    { code: 'AGRIBANK', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam' },
    { code: 'ACB', name: 'Ngân hàng TMCP Á Châu' },
    { code: 'TECHCOMBANK', name: 'Ngân hàng TMCP Kỹ thương Việt Nam' },
    { code: 'MBBANK', name: 'Ngân hàng TMCP Quân đội' },
    { code: 'VPBANK', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
    { code: 'HDBANK', name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh' },
    { code: 'SACOMBANK', name: 'Ngân hàng TMCP Sài Gòn Thương Tín' },
    { code: 'EXIMBANK', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam' },
    { code: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội' },
    { code: 'OCB', name: 'Ngân hàng TMCP Phương Đông' },
    { code: 'TPBANK', name: 'Ngân hàng TMCP Tiên Phong' },
    { code: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam' },
    { code: 'SCB', name: 'Ngân hàng TMCP Sài Gòn' },
    { code: 'MSB', name: 'Ngân hàng TMCP Hàng Hải' },
    { code: 'NCB', name: 'Ngân hàng TMCP Quốc Dân' },
    { code: 'DONGABANK', name: 'Ngân hàng TMCP Đông Á' },
    { code: 'BAOVIETBANK', name: 'Ngân hàng TMCP Bảo Việt' },
    { code: 'PUBLICBANK', name: 'Ngân hàng TNHH MTV Public Việt Nam' },
    { code: 'GPBANK', name: 'Ngân hàng TMCP Dầu Khí Toàn Cầu' },
    { code: 'ABBANK', name: 'Ngân hàng TMCP An Bình' },
    { code: 'OCEANBANK', name: 'Ngân hàng TMCP Đại Dương' },
    { code: 'VIETBANK', name: 'Ngân hàng TMCP Việt Nam Thương Tín' },
    { code: 'NAMABANK', name: 'Ngân hàng TMCP Nam Á' },
    { code: 'PGBANK', name: 'Ngân hàng TMCP Xăng dầu Petrolimex' },
    { code: 'BAB', name: 'Ngân hàng TMCP Bắc Á' },
    { code: 'SCVN', name: 'Ngân hàng TMCP Sài Gòn Công Thương' },
    { code: 'VIETABANK', name: 'Ngân hàng TMCP Việt Á' },
    { code: 'VCCB', name: 'Ngân hàng TMCP Bản Việt' },
    { code: 'KLB', name: 'Ngân hàng TMCP Kiên Long' },
    { code: 'LPB', name: 'Ngân hàng TMCP Lào - Việt' },
    { code: 'KDB', name: 'Ngân hàng TNHH MTV Kookmin Việt Nam' },
    { code: 'SHINHAN', name: 'Ngân hàng TNHH MTV Shinhan Việt Nam' },
    { code: 'CITIBANK', name: 'Ngân hàng TNHH MTV Citibank Việt Nam' },
    { code: 'HSBC', name: 'Ngân hàng TNHH MTV HSBC Việt Nam' },
    { code: 'STANDARDCHARTERED', name: 'Ngân hàng TNHH MTV Standard Chartered Việt Nam' },
    { code: 'ANZ', name: 'Ngân hàng TNHH MTV ANZ Việt Nam' },
    { code: 'HONGLEONG', name: 'Ngân hàng TNHH MTV Hong Leong Việt Nam' },
    { code: 'WOORI', name: 'Ngân hàng TNHH MTV Woori Việt Nam' },
    { code: 'UOB', name: 'Ngân hàng TNHH MTV United Overseas Bank Việt Nam' },
    { code: 'MAYBANK', name: 'Ngân hàng TNHH MTV Maybank Việt Nam' },
    { code: 'PUBLICBANK', name: 'Ngân hàng TNHH MTV Public Việt Nam' },
    { code: 'CIMB', name: 'Ngân hàng TNHH MTV CIMB Việt Nam' },
    { code: 'MOMO', name: 'Ví MoMo' },
    { code: 'ZALOPAY', name: 'Ví ZaloPay' },
    { code: 'VIETTELPAY', name: 'Ví ViettelPay' },
    { code: 'AIRPAY', name: 'Ví AirPay' },
    { code: 'VNPAY', name: 'Ví VNPay' }
  ];

  return c.json(createSuccessResponse(banks, 'Available banks retrieved successfully'));
});

// POST /api/payments/vnpay/create-token-url
app.post('/create-token-url', async (c) => {
  try {
    const body = await c.req.json();
    const { 
      userId, 
      txnRef, 
      locale,
      returnUrl,
      cancelUrl,
      cardType,
      orderDescription,
      ipAddress
    } = body;

    // Validate required fields
    if (!userId || !txnRef || !returnUrl) {
      return c.json(createErrorResponse(
        'Missing required fields: userId, txnRef, returnUrl',
        [],
        400
      ), 400);
    }

    const vnpayService = new VNPayService(c.env);
    
    const result = await vnpayService.createTokenUrl({
      userId,
      txnRef,
      locale: locale || 'vn',
      returnUrl,
      cancelUrl,
      cardType: cardType || '01',
      orderDescription: orderDescription || 'Tao moi token',
      ipAddress: ipAddress || c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1'
    });

    if (!result.success) {
      return c.json(createErrorResponse(
        result.error || 'Failed to create token URL',
        [],
        400
      ), 400);
    }

    return c.json(createSuccessResponse({
      tokenUrl: result.tokenUrl,
      debug: result.debug
    }, 'Token URL created successfully'));

  } catch (error: any) {
    console.error('Error creating token URL:', error);
    return c.json(createErrorResponse(
      'Internal server error',
      [],
      500
    ), 500);
  }
});

// POST /api/payments/vnpay/pay-and-create-url
app.post('/pay-and-create-url', async (c) => {
  try {
    const body = await c.req.json();
    const { 
      userId, 
      txnRef, 
      amount,
      locale,
      returnUrl,
      cancelUrl,
      cardType,
      storeToken,
      orderDescription,
      ipAddress
    } = body;

    // Validate required fields
    if (!userId || !txnRef || !amount || !returnUrl) {
      return c.json(createErrorResponse(
        'Missing required fields: userId, txnRef, amount, returnUrl',
        [],
        400
      ), 400);
    }

    const vnpayService = new VNPayService(c.env);
    
    const result = await vnpayService.createPayAndCreateTokenUrl({
      userId,
      txnRef,
      amount: parseFloat(amount),
      locale: locale || 'vn',
      returnUrl,
      cancelUrl,
      cardType: cardType || '01',
      storeToken: storeToken !== false, // Default to true
      orderDescription: orderDescription || 'Thanh toan va tao token',
      ipAddress: ipAddress || c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1'
    });

    if (!result.success) {
      return c.json(createErrorResponse(
        result.error || 'Failed to create pay and create token URL',
        [],
        400
      ), 400);
    }

    return c.json(createSuccessResponse({
      tokenUrl: result.tokenUrl,
      debug: result.debug
    }, 'Pay and create token URL created successfully'));

  } catch (error: any) {
    console.error('Error creating pay and create token URL:', error);
    return c.json(createErrorResponse(
      'Internal server error',
      [],
      500
    ), 500);
  }
});

// GET /api/payments/vnpay/token-return
app.get('/token-return', async (c) => {
  try {
    const queryParams = c.req.query();
    
    const vnpayService = new VNPayService(c.env);
    const verification = await vnpayService.verifyTokenReturnData(queryParams);
    
    if (!verification.isValid) {
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lỗi xác thực VNPay</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Lỗi xác thực giao dịch</h2>
            <p>${verification.error}</p>
            <p>Vui lòng liên hệ hỗ trợ nếu vấn đề tiếp tục xảy ra.</p>
          </div>
        </body>
        </html>
      `);
    }

    const tokenData = verification.tokenData;
    const isSuccess = tokenData.vnp_ResponseCode === '00' && tokenData.vnp_TransactionStatus === '00';
    
    if (isSuccess) {
      // TODO: Save token to database
      // TODO: Update transaction status
      
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Giao dịch thành công</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .success { color: #2e7d32; background: #e8f5e8; padding: 20px; border-radius: 8px; }
            .token-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="success">
            <h2>✅ Giao dịch thành công!</h2>
            <p>Token đã được tạo thành công.</p>
            ${tokenData.vnp_Token ? `
              <div class="token-info">
                <p><strong>Token:</strong> ${tokenData.vnp_Token}</p>
                <p><strong>Thẻ:</strong> ${tokenData.vnp_CardNumber || 'N/A'}</p>
                <p><strong>Mã giao dịch:</strong> ${tokenData.vnp_TransactionNo}</p>
              </div>
            ` : ''}
            <p>Bạn có thể đóng cửa sổ này.</p>
          </div>
        </body>
        </html>
      `);
    } else {
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Giao dịch thất bại</title>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Giao dịch thất bại</h2>
            <p>Mã lỗi: ${tokenData.vnp_ResponseCode}</p>
            <p>Trạng thái: ${tokenData.vnp_TransactionStatus}</p>
            <p>Vui lòng thử lại hoặc liên hệ hỗ trợ.</p>
          </div>
        </body>
        </html>
      `);
    }

  } catch (error: any) {
    console.error('Error processing token return:', error);
    return c.html(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Lỗi hệ thống</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .error { color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>❌ Lỗi hệ thống</h2>
          <p>Đã xảy ra lỗi khi xử lý giao dịch.</p>
          <p>Vui lòng liên hệ hỗ trợ.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// POST /api/payments/vnpay/token-ipn
app.post('/token-ipn', async (c) => {
  try {
    const body = await c.req.json();
    
    const vnpayService = new VNPayService(c.env);
    const verification = await vnpayService.verifyTokenReturnData(body);
    
    if (!verification.isValid) {
      console.error('Invalid token IPN:', verification.error);
      return c.json({ RspCode: '97', Message: 'Invalid secure hash' });
    }

    const tokenData = verification.tokenData;
    const isSuccess = tokenData.vnp_ResponseCode === '00' && tokenData.vnp_TransactionStatus === '00';
    
    if (isSuccess) {
      // TODO: Idempotent update database
      // TODO: Save token if present
      console.log('Token IPN success:', tokenData);
    } else {
      console.log('Token IPN failed:', tokenData);
    }

    return c.json({ RspCode: '00', Message: 'success' });

  } catch (error: any) {
    console.error('Error processing token IPN:', error);
    return c.json({ RspCode: '99', Message: 'System error' });
  }
});

export default app;
