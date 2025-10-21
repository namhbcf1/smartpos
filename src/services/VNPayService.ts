import { Env } from '../types';

export interface VNPayConfig {
  tmnCode: string;
  hashSecret: string;
  url: string;
  returnUrl: string;
  ipnUrl: string;
  merchantAccount: string;
}

export interface VNPayPaymentRequest {
  orderId: string;
  amount: number; // Amount in VND (without decimal)
  orderDescription: string;
  bankCode?: string;
  locale?: string;
  ipAddress?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  // Extended PAY parameters
  currency?: string;
  returnUrl?: string;
  expireDate?: string;
  orderType?: string;
  billing?: {
    mobile?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    city?: string;
    country?: string;
    state?: string;
  };
  invoice?: {
    phone?: string;
    email?: string;
    customer?: string;
    address?: string;
    company?: string;
    taxcode?: string;
    type?: string;
  };
}

export interface VNPayTokenRequest {
  userId: string;
  txnRef: string;
  amount?: number; // Required for pay_and_create
  locale?: string;
  returnUrl: string;
  cancelUrl?: string;
  cardType?: '01' | '02'; // 01: Nội địa, 02: Quốc tế
  storeToken?: boolean;
  orderDescription?: string;
  ipAddress?: string;
}

export interface VNPayTokenResponse {
  success: boolean;
  tokenUrl?: string;
  error?: string;
  debug?: {
    parameters: any;
    queryString: string;
    secureHash: string;
  };
}

export interface VNPayPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  error?: string;
}

export interface VNPayReturnData {
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHash: string;
  vnp_SecureHashType: string;
}

export class VNPayService {
  private config: VNPayConfig;

  constructor(env: Env) {
    this.config = {
      tmnCode: env.VNPAY_TMN_CODE || 'DEMOV210',
      hashSecret: env.VNPAY_HASH_SECRET || 'RAOEXHYVSDDIIENYWSLDKIENNSBIEDOE',
      url: env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
      returnUrl: env.VNPAY_RETURN_URL || `${env.FRONTEND_URL}/payment/vnpay-return`,
      ipnUrl: env.VNPAY_IPN_URL || `${env.API_BASE_URL}/api/payments/vnpay/ipn`,
      merchantAccount: env.VNPAY_MERCHANT_ACCOUNT || '8990124112002'
    };
  }

  /**
   * Tạo URL tạo token VNPay (token_create)
   */
  async createTokenUrl(request: VNPayTokenRequest): Promise<VNPayTokenResponse> {
    try {
      const {
        userId,
        txnRef,
        locale = 'vn',
        returnUrl,
        cancelUrl,
        cardType = '01',
        orderDescription = 'Tao moi token',
        ipAddress = '127.0.0.1'
      } = request;

      // Validate input
      if (!userId || !txnRef || !returnUrl) {
        return {
          success: false,
          error: 'Missing required parameters: userId, txnRef, returnUrl'
        };
      }

      // Ensure txnRef is unique and valid format
      const timestamp = Date.now();
      const validTxnRef = `${txnRef}_${timestamp}`.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);

      // Create date string in format yyyyMMddHHmmss (GMT+7)
      const now = new Date();
      const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // GMT+7
      const createDate = vietnamTime.toISOString()
        .replace(/[-:T]/g, '')
        .replace(/\..+/, '');

      // Build parameters for token_create
      const params: Record<string, string> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'token_create',
        vnp_TmnCode: this.config.tmnCode,
        vnp_AppUserId: userId,
        vnp_TxnRef: validTxnRef,
        vnp_TxnDesc: orderDescription,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddress,
        vnp_Locale: locale,
        vnp_CardType: cardType,
        vnp_CreateDate: createDate
      };

      // Add cancel URL if specified
      if (cancelUrl) {
        params.vnp_CancelUrl = cancelUrl;
      }

      // Remove empty parameters and clean values
      Object.keys(params).forEach(key => {
        if (!params[key] || params[key].trim() === '') {
          delete params[key];
        } else {
          params[key] = params[key].trim();
        }
      });

      // Sort parameters alphabetically
      const sortedParams = this.sortObject(params);

      // Create query string
      const queryString = this.createQueryString(sortedParams);

      // Create secure hash
      const secureHash = await this.createSecureHash(queryString);

      // Build final URL
      const tokenUrl = `https://sandbox.vnpayment.vn/token_ui/create-token.html?${queryString}&vnp_SecureHash=${secureHash}`;

      // Log for debugging
      console.log('VNPay Token URL created:', tokenUrl);
      console.log('VNPay Token Parameters:', sortedParams);

      return {
        success: true,
        tokenUrl,
        debug: {
          parameters: sortedParams,
          queryString,
          secureHash
        }
      };

    } catch (error: any) {
      console.error('VNPay create token URL error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create token URL'
      };
    }
  }

  /**
   * Tạo URL thanh toán và tạo token VNPay (pay_and_create)
   */
  async createPayAndCreateTokenUrl(request: VNPayTokenRequest): Promise<VNPayTokenResponse> {
    try {
      const {
        userId,
        txnRef,
        amount,
        locale = 'vn',
        returnUrl,
        cancelUrl,
        cardType = '01',
        storeToken = true,
        orderDescription = 'Thanh toan va tao token',
        ipAddress = '127.0.0.1'
      } = request;

      // Validate input
      if (!userId || !txnRef || !amount || !returnUrl) {
        return {
          success: false,
          error: 'Missing required parameters: userId, txnRef, amount, returnUrl'
        };
      }

      // Ensure txnRef is unique and valid format
      const timestamp = Date.now();
      const validTxnRef = `${txnRef}_${timestamp}`.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);

      // Convert amount to VND (multiply by 100 to remove decimal)
      const vnpAmount = Math.round(amount * 100);

      // Create date string in format yyyyMMddHHmmss (GMT+7)
      const now = new Date();
      const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // GMT+7
      const createDate = vietnamTime.toISOString()
        .replace(/[-:T]/g, '')
        .replace(/\..+/, '');

      // Build parameters for pay_and_create
      const params: Record<string, string> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay_and_create',
        vnp_TmnCode: this.config.tmnCode,
        vnp_AppUserId: userId,
        vnp_TxnRef: validTxnRef,
        vnp_Amount: vnpAmount.toString(),
        vnp_CurrCode: 'VND',
        vnp_TxnDesc: orderDescription,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddress,
        vnp_Locale: locale,
        vnp_CardType: cardType,
        vnp_CreateDate: createDate,
        vnp_StoreToken: storeToken ? '1' : '0'
      };

      // Add cancel URL if specified
      if (cancelUrl) {
        params.vnp_CancelUrl = cancelUrl;
      }

      // Remove empty parameters and clean values
      Object.keys(params).forEach(key => {
        if (!params[key] || params[key].trim() === '') {
          delete params[key];
        } else {
          params[key] = params[key].trim();
        }
      });

      // Sort parameters alphabetically
      const sortedParams = this.sortObject(params);

      // Create query string
      const queryString = this.createQueryString(sortedParams);

      // Create secure hash
      const secureHash = await this.createSecureHash(queryString);

      // Build final URL
      const tokenUrl = `https://sandbox.vnpayment.vn/token_ui/pay-create-token.html?${queryString}&vnp_SecureHash=${secureHash}`;

      // Log for debugging
      console.log('VNPay Pay and Create Token URL created:', tokenUrl);
      console.log('VNPay Pay and Create Token Parameters:', sortedParams);

      return {
        success: true,
        tokenUrl,
        debug: {
          parameters: sortedParams,
          queryString,
          secureHash
        }
      };

    } catch (error: any) {
      console.error('VNPay create pay and create token URL error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create pay and create token URL'
      };
    }
  }

  /**
   * Tạo URL thanh toán VNPay PAY (vnp_Command = pay) - Implementation mới theo spec
   */
  async createPayUrl(request: VNPayPaymentRequest): Promise<VNPayPaymentResponse> {
    try {
      const {
        orderId,
        amount,
        orderDescription,
        bankCode,
        locale = 'vn',
        ipAddress = '127.0.0.1',
        currency = 'VND',
        returnUrl = this.config.returnUrl,
        expireDate,
        orderType = 'other',
        billing,
        invoice
      } = request;

      if (!orderId || !amount || !orderDescription) {
        return {
          success: false,
          error: 'Missing required parameters: orderId, amount, orderDescription'
        };
      }

      // Validate amount
      if (amount <= 0 || !Number.isInteger(amount)) {
        return {
          success: false,
          error: 'Amount must be a positive integer'
        };
      }

      // Generate unique txnRef (orderId + timestamp)
      const timestamp = Date.now();
      const txnRef = `${orderId}_${timestamp}`.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);

      // Create date in GMT+7
      const now = new Date();
      const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const createDate = vietnamTime.toISOString()
        .replace(/[-:T]/g, '')
        .replace(/\..+/, '');

      // Clean order description (Vietnamese without diacritics, no special chars)
      const cleanOrderInfo = this.cleanOrderDescription(orderDescription);

      // Build parameters
      const params: Record<string, string> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: this.config.tmnCode,
        vnp_Amount: (amount * 100).toString(), // Multiply by 100
        vnp_CreateDate: createDate,
        vnp_CurrCode: currency,
        vnp_IpAddr: ipAddress,
        vnp_Locale: locale,
        vnp_OrderInfo: cleanOrderInfo,
        vnp_OrderType: orderType,
        vnp_ReturnUrl: returnUrl,
        vnp_TxnRef: txnRef
      };

      // Add optional parameters
      if (bankCode) {
        params.vnp_BankCode = bankCode;
      }

      if (expireDate) {
        params.vnp_ExpireDate = expireDate;
      }

      // Add billing information
      if (billing) {
        if (billing.mobile) params.vnp_Bill_Mobile = billing.mobile;
        if (billing.email) params.vnp_Bill_Email = billing.email;
        if (billing.firstName) params.vnp_Bill_FirstName = billing.firstName;
        if (billing.lastName) params.vnp_Bill_LastName = billing.lastName;
        if (billing.address) params.vnp_Bill_Address = billing.address;
        if (billing.city) params.vnp_Bill_City = billing.city;
        if (billing.country) params.vnp_Bill_Country = billing.country;
        if (billing.state) params.vnp_Bill_State = billing.state;
      }

      // Add invoice information
      if (invoice) {
        if (invoice.phone) params.vnp_Inv_Phone = invoice.phone;
        if (invoice.email) params.vnp_Inv_Email = invoice.email;
        if (invoice.customer) params.vnp_Inv_Customer = invoice.customer;
        if (invoice.address) params.vnp_Inv_Address = invoice.address;
        if (invoice.company) params.vnp_Inv_Company = invoice.company;
        if (invoice.taxcode) params.vnp_Inv_Taxcode = invoice.taxcode;
        if (invoice.type) params.vnp_Inv_Type = invoice.type;
      }

      // Remove empty parameters
      Object.keys(params).forEach(key => {
        if (!params[key] || params[key].trim() === '') {
          delete params[key];
        } else {
          params[key] = params[key].trim();
        }
      });

      // Sort parameters and create query string
      const sortedParams = this.sortObject(params);
      const queryString = this.createQueryString(sortedParams);
      const secureHash = await this.createSecureHash(queryString);

      // Build final URL
      const paymentUrl = `${this.config.url}?${queryString}&vnp_SecureHash=${secureHash}`;

      console.log('VNPay PAY URL created:', paymentUrl);
      console.log('VNPay PAY Parameters:', sortedParams);

      return {
        success: true,
        paymentUrl,
        debug: {
          parameters: sortedParams,
          queryString,
          secureHash
        }
      };

    } catch (error: any) {
      console.error('VNPay create PAY URL error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment URL'
      };
    }
  }

  /**
   * Tạo URL thanh toán VNPay (cũ - giữ lại để tương thích)
   */
  async createPaymentUrl(request: VNPayPaymentRequest): Promise<VNPayPaymentResponse> {
    try {
      const {
        orderId,
        amount,
        orderDescription,
        bankCode,
        locale = 'vn',
        ipAddress = '127.0.0.1',
        customerName = 'Khách hàng',
        customerEmail = '',
        customerPhone = '',
        customerAddress = ''
      } = request;

      // Validate input
      if (!orderId || !amount || !orderDescription) {
        return {
          success: false,
          error: 'Missing required parameters'
        };
      }

      // Ensure orderId is unique and valid format - không được trùng lặp trong ngày
      const timestamp = Date.now();
      const validOrderId = `${orderId}_${timestamp}`.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 100);
      
      // Clean order description - theo yêu cầu VNPay: Tiếng Việt không dấu và không bao gồm các ký tự đặc biệt
      const cleanOrderDescription = orderDescription
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/[đ]/g, 'd')
        .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
        .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
        .replace(/[ÌÍỊỈĨ]/g, 'I')
        .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
        .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
        .replace(/[ỲÝỴỶỸ]/g, 'Y')
        .replace(/[Đ]/g, 'D')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 255);

      // Convert amount to VND (multiply by 100 to remove decimal)
      const vnpAmount = Math.round(amount * 100);

      // Create date string in format yyyyMMddHHmmss (GMT+7)
      const now = new Date();
      const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // GMT+7
      const createDate = vietnamTime.toISOString()
        .replace(/[-:T]/g, '')
        .replace(/\..+/, '');

      // Build parameters - theo đúng tài liệu VNPay
      const params: Record<string, string> = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: this.config.tmnCode,
        vnp_Amount: vnpAmount.toString(),
        vnp_CreateDate: createDate,
        vnp_CurrCode: 'VND',
        vnp_IpAddr: ipAddress,
        vnp_Locale: locale,
        vnp_OrderInfo: cleanOrderDescription,
        vnp_OrderType: 'other',
        vnp_ReturnUrl: this.config.returnUrl,
        vnp_TxnRef: validOrderId,
        vnp_ExpireDate: new Date(vietnamTime.getTime() + 15 * 60 * 1000).toISOString()
          .replace(/[-:T]/g, '')
          .replace(/\..+/, '') // 15 minutes from now (GMT+7)
      };

      // Add bank code if specified
      if (bankCode) {
        params.vnp_BankCode = bankCode;
      }

      // Remove empty parameters and clean values
      Object.keys(params).forEach(key => {
        if (!params[key] || params[key].trim() === '') {
          delete params[key];
        } else {
          // Clean parameter values
          params[key] = params[key].trim();
        }
      });

      // Sort parameters alphabetically
      const sortedParams = this.sortObject(params);

      // Create query string
      const queryString = this.createQueryString(sortedParams);

      // Create secure hash
      const secureHash = await this.createSecureHash(queryString);

      // Build final URL
      const paymentUrl = `${this.config.url}?${queryString}&vnp_SecureHash=${secureHash}`;

      // Log for debugging
      console.log('VNPay URL created:', paymentUrl);
      console.log('VNPay Parameters:', sortedParams);

      return {
        success: true,
        paymentUrl,
        debug: {
          parameters: sortedParams,
          queryString,
          secureHash
        }
      };

    } catch (error: any) {
      console.error('VNPay create payment URL error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create payment URL'
      };
    }
  }

  /**
   * Xác thực dữ liệu trả về từ VNPay cho PAY operations
   */
  async verifyPayReturnData(data: any): Promise<{ isValid: boolean; error?: string; paymentData?: any }> {
    try {
      const { vnp_SecureHash, ...params } = data;
      
      if (!vnp_SecureHash) {
        return { isValid: false, error: 'Missing vnp_SecureHash' };
      }

      const sortedParams = this.sortObject(params);
      const queryString = this.createQueryString(sortedParams);
      const expectedHash = await this.createSecureHash(queryString);
      
      if (vnp_SecureHash !== expectedHash) {
        return { isValid: false, error: 'Invalid secure hash' };
      }

      return { 
        isValid: true, 
        paymentData: {
          vnp_ResponseCode: data.vnp_ResponseCode,
          vnp_TransactionStatus: data.vnp_TransactionStatus,
          vnp_TxnRef: data.vnp_TxnRef,
          vnp_Amount: data.vnp_Amount,
          vnp_TransactionNo: data.vnp_TransactionNo,
          vnp_PayDate: data.vnp_PayDate,
          vnp_BankCode: data.vnp_BankCode,
          vnp_CardType: data.vnp_CardType,
          vnp_OrderInfo: data.vnp_OrderInfo
        }
      };
    } catch (error: any) {
      return { isValid: false, error: error.message };
    }
  }

  /**
   * Xác thực dữ liệu trả về từ VNPay (cho Token operations)
   */
  async verifyTokenReturnData(data: any): Promise<{ isValid: boolean; error?: string; tokenData?: any }> {
    try {
      const { vnp_SecureHash, ...params } = data;
      
      if (!vnp_SecureHash) {
        return { isValid: false, error: 'Missing vnp_SecureHash' };
      }

      // Sort parameters alphabetically
      const sortedParams = this.sortObject(params);
      
      // Create query string
      const queryString = this.createQueryString(sortedParams);
      
      // Create secure hash
      const expectedHash = await this.createSecureHash(queryString);
      
      if (vnp_SecureHash !== expectedHash) {
        return { isValid: false, error: 'Invalid secure hash' };
      }

      return { 
        isValid: true, 
        tokenData: {
          vnp_ResponseCode: data.vnp_ResponseCode,
          vnp_TransactionStatus: data.vnp_TransactionStatus,
          vnp_Token: data.vnp_Token,
          vnp_CardNumber: data.vnp_CardNumber,
          vnp_CardType: data.vnp_CardType,
          vnp_BankCode: data.vnp_BankCode,
          vnp_TransactionNo: data.vnp_TransactionNo,
          vnp_TxnRef: data.vnp_TxnRef,
          vnp_AppUserId: data.vnp_AppUserId,
          vnp_Amount: data.vnp_Amount,
          vnp_PayDate: data.vnp_PayDate
        }
      };
    } catch (error: any) {
      return { isValid: false, error: error.message };
    }
  }

  /**
   * Xác thực dữ liệu trả về từ VNPay
   */
  async verifyReturnData(data: VNPayReturnData): Promise<{ isValid: boolean; error?: string }> {
    try {
      const { vnp_SecureHash, vnp_SecureHashType, ...params } = data;

      // Remove secure hash fields
      const cleanParams = { ...params };
      delete (cleanParams as any).vnp_SecureHash;
      delete (cleanParams as any).vnp_SecureHashType;

      // Sort parameters
      const sortedParams = this.sortObject(cleanParams);

      // Create query string
      const queryString = this.createQueryString(sortedParams);

      // Create secure hash
      const expectedHash = await this.createSecureHash(queryString);

      // Verify hash
      if (expectedHash !== vnp_SecureHash) {
        return {
          isValid: false,
          error: 'Invalid secure hash'
        };
      }

      return { isValid: true };

    } catch (error: any) {
      console.error('VNPay verify return data error:', error);
      return {
        isValid: false,
        error: error.message || 'Failed to verify return data'
      };
    }
  }

  /**
   * Xử lý IPN (Instant Payment Notification) từ VNPay
   */
  async processIPN(data: VNPayReturnData, env: Env): Promise<{ success: boolean; error?: string }> {
    try {
      // Verify the data first
      const verification = await this.verifyReturnData(data);
      if (!verification.isValid) {
        return {
          success: false,
          error: verification.error
        };
      }

      const {
        vnp_ResponseCode,
        vnp_TransactionStatus,
        vnp_TxnRef,
        vnp_Amount,
        vnp_TransactionNo,
        vnp_BankTranNo
      } = data;

      // Check if transaction is successful
      const isSuccess = vnp_ResponseCode === '00' && vnp_TransactionStatus === '00';

      // Update order status in database
      if (isSuccess) {
        await env.DB.prepare(`
          UPDATE orders 
          SET 
            status = 'completed',
            payment_status = 'paid',
            payment_method = 'vnpay',
            updated_at = datetime('now')
          WHERE id = ? AND COALESCE(tenant_id, 'default') = 'default'
        `).bind(vnp_TxnRef).run();

        // Create payment record
        await env.DB.prepare(`
          INSERT INTO payments (
            id, order_id, payment_method_id, amount_cents, 
            reference, status, processed_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          vnp_TxnRef,
          'vnpay',
          parseInt(vnp_Amount),
          vnp_TransactionNo,
          'completed',
          new Date().toISOString(),
          new Date().toISOString()
        ).run();

        // Update inventory if needed
        await this.updateInventoryAfterPayment(vnp_TxnRef, env);

        console.log(`VNPay IPN: Order ${vnp_TxnRef} payment successful`);
      } else {
        // Update order status to failed
        await env.DB.prepare(`
          UPDATE orders 
          SET 
            status = 'cancelled',
            payment_status = 'failed',
            updated_at = datetime('now')
          WHERE id = ? AND COALESCE(tenant_id, 'default') = 'default'
        `).bind(vnp_TxnRef).run();

        console.log(`VNPay IPN: Order ${vnp_TxnRef} payment failed - ResponseCode: ${vnp_ResponseCode}`);
      }

      return { success: true };

    } catch (error: any) {
      console.error('VNPay IPN processing error:', error);
      return {
        success: false,
        error: error.message || 'Failed to process IPN'
      };
    }
  }

  /**
   * Cập nhật tồn kho sau khi thanh toán thành công
   */
  private async updateInventoryAfterPayment(orderId: string, env: Env): Promise<void> {
    try {
      // Get order items
      const orderItems = await env.DB.prepare(`
        SELECT product_id, quantity, serial_numbers
        FROM order_items 
        WHERE order_id = ?
      `).bind(orderId).all();

      for (const item of orderItems.results || []) {
        const { product_id, quantity, serial_numbers } = item as any;

        // Update product stock
        await env.DB.prepare(`
          UPDATE products 
          SET stock = stock - ?, updated_at = datetime('now')
          WHERE id = ? AND COALESCE(tenant_id, 'default') = 'default'
        `).bind(quantity, product_id).run();

        // Update serial numbers if provided
        if (serial_numbers) {
          const serials = JSON.parse(serial_numbers);
          for (const serial of serials) {
            await env.DB.prepare(`
              UPDATE serial_numbers 
              SET status = 'sold', updated_at = datetime('now')
              WHERE serial_number = ? AND product_id = ? AND COALESCE(tenant_id, 'default') = 'default'
            `).bind(serial, product_id).run();
          }
        }

        // Create inventory movement record
        await env.DB.prepare(`
          INSERT INTO inventory_movements (
            id, product_id, transaction_type, quantity, 
            reference_id, reference_type, reason, 
            product_name, product_sku, created_at, tenant_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          product_id,
          'sale',
          -quantity, // Negative for outgoing
          orderId,
          'order',
          'VNPay payment completed',
          '', // Will be filled by trigger
          '', // Will be filled by trigger
          new Date().toISOString(),
          'default'
        ).run();
      }

    } catch (error) {
      console.error('Update inventory after payment error:', error);
    }
  }

  /**
   * Sắp xếp object theo thứ tự alphabet
   */
  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: Record<string, string> = {};
    
    for (const key of sortedKeys) {
      sortedObj[key] = obj[key];
    }
    
    return sortedObj;
  }

  /**
   * Tạo query string từ object
   */
  private createQueryString(params: Record<string, string>): string {
    return Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
  }

  /**
   * Tạo secure hash sử dụng Web Crypto API
   */
  private async createSecureHash(queryString: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.config.hashSecret);
    const messageData = encoder.encode(queryString);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Lấy thông tin giao dịch từ VNPay
   */
  async queryTransaction(orderId: string, env: Env): Promise<any> {
    try {
      const createDate = new Date().toISOString()
        .replace(/[-:T]/g, '')
        .replace(/\..+/, '');

      const params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'querydr',
        vnp_TmnCode: this.config.tmnCode,
        vnp_TxnRef: orderId,
        vnp_CreateDate: createDate
      };

      const sortedParams = this.sortObject(params);
      const queryString = this.createQueryString(sortedParams);
      const secureHash = await this.createSecureHash(queryString);

      const queryUrl = `https://sandbox.vnpayment.vn/merchant_webapi/api/transaction?${queryString}&vnp_SecureHash=${secureHash}`;

      // Make request to VNPay
      const response = await fetch(queryUrl);
      const result = await response.json();

      return {
        success: true,
        data: result
      };

    } catch (error: any) {
      console.error('VNPay query transaction error:', error);
      return {
        success: false,
        error: error.message || 'Failed to query transaction'
      };
    }
  }

  /**
   * Clean order description for VNPay (Vietnamese without diacritics, no special chars)
   */
  private cleanOrderDescription(orderDescription: string): string {
    return orderDescription
      .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
      .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
      .replace(/[ìíịỉĩ]/g, 'i')
      .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
      .replace(/[ùúụủũưừứựửữ]/g, 'u')
      .replace(/[ỳýỵỷỹ]/g, 'y')
      .replace(/[đ]/g, 'd')
      .replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, 'A')
      .replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, 'E')
      .replace(/[ÌÍỊỈĨ]/g, 'I')
      .replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, 'O')
      .replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, 'U')
      .replace(/[ỲÝỴỶỸ]/g, 'Y')
      .replace(/[Đ]/g, 'D')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 255);
  }

  /**
   * Xử lý IPN từ VNPay cho PAY operations
   */
  async processPayIPN(data: any): Promise<{ success: boolean; error?: string; response?: any }> {
    try {
      const { vnp_SecureHash, ...params } = data;
      
      if (!vnp_SecureHash) {
        return { 
          success: false, 
          error: 'Missing vnp_SecureHash',
          response: { RspCode: '97', Message: 'Missing secure hash' }
        };
      }

      const sortedParams = this.sortObject(params);
      const queryString = this.createQueryString(sortedParams);
      const expectedHash = await this.createSecureHash(queryString);
      
      if (vnp_SecureHash !== expectedHash) {
        return { 
          success: false, 
          error: 'Invalid secure hash',
          response: { RspCode: '97', Message: 'Invalid secure hash' }
        };
      }

      // Extract payment data
      const paymentData = {
        vnp_ResponseCode: data.vnp_ResponseCode,
        vnp_TransactionStatus: data.vnp_TransactionStatus,
        vnp_TxnRef: data.vnp_TxnRef,
        vnp_Amount: data.vnp_Amount,
        vnp_TransactionNo: data.vnp_TransactionNo,
        vnp_PayDate: data.vnp_PayDate,
        vnp_BankCode: data.vnp_BankCode,
        vnp_CardType: data.vnp_CardType,
        vnp_OrderInfo: data.vnp_OrderInfo
      };

      // TODO: Update database with payment status
      // This should be implemented in the route handler
      
      return { 
        success: true, 
        response: { RspCode: '00', Message: 'success' },
        paymentData
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message,
        response: { RspCode: '99', Message: 'Internal error' }
      };
    }
  }
}
