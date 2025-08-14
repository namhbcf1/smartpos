/**
 * VNPay Payment Gateway Service
 * Tích hợp thanh toán VNPay cho ComputerPOS Pro
 */

import crypto from 'node:crypto';

export interface VNPayConfig {
  vnp_TmnCode: string;
  vnp_HashSecret: string;
  vnp_Url: string;
  vnp_ReturnUrl: string;
  vnp_IpnUrl: string;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  orderInfo: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  locale?: string;
}

export interface VNPayResponse {
  paymentUrl: string;
  qrCode?: string;
  transactionId: string;
}

export interface VNPayCallback {
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
}

export class VNPayService {
  private config: VNPayConfig;

  constructor(config: VNPayConfig) {
    this.config = config;
  }

  /**
   * Tạo URL thanh toán VNPay
   */
  async createPayment(request: PaymentRequest): Promise<VNPayResponse> {
    const vnp_Params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.config.vnp_TmnCode,
      vnp_Locale: request.locale || 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: request.orderId,
      vnp_OrderInfo: request.orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: (request.amount * 100).toString(), // VNPay yêu cầu amount * 100
      vnp_ReturnUrl: this.config.vnp_ReturnUrl,
      vnp_IpAddr: '127.0.0.1', // Sẽ được cập nhật từ request
      vnp_CreateDate: this.formatDate(new Date()),
      vnp_ExpireDate: this.formatDate(new Date(Date.now() + 15 * 60 * 1000)) // 15 phút
    };

    // Thêm thông tin khách hàng nếu có
    if (request.customerInfo?.name) {
      vnp_Params.vnp_Bill_FirstName = request.customerInfo.name;
    }
    if (request.customerInfo?.phone) {
      vnp_Params.vnp_Bill_Mobile = request.customerInfo.phone;
    }
    if (request.customerInfo?.email) {
      vnp_Params.vnp_Bill_Email = request.customerInfo.email;
    }

    // Sắp xếp tham số và tạo chữ ký
    const sortedParams = this.sortParams(vnp_Params);
    const signData = this.buildQueryString(sortedParams);
    const secureHash = this.createSecureHash(signData);

    sortedParams.vnp_SecureHash = secureHash;

    const paymentUrl = `${this.config.vnp_Url}?${this.buildQueryString(sortedParams)}`;

    return {
      paymentUrl,
      transactionId: request.orderId,
      qrCode: await this.generateQRCode(paymentUrl)
    };
  }

  /**
   * Xác thực callback từ VNPay
   */
  async verifyCallback(callbackData: VNPayCallback): Promise<boolean> {
    const { vnp_SecureHash, ...params } = callbackData;
    
    const sortedParams = this.sortParams(params);
    const signData = this.buildQueryString(sortedParams);
    const expectedHash = this.createSecureHash(signData);

    return vnp_SecureHash === expectedHash;
  }

  /**
   * Kiểm tra trạng thái giao dịch
   */
  isPaymentSuccessful(responseCode: string): boolean {
    return responseCode === '00';
  }

  /**
   * Tạo mã QR cho thanh toán
   */
  private async generateQRCode(paymentUrl: string): Promise<string> {
    // Sử dụng VNPay QR API hoặc tạo QR code từ URL
    const qrData = {
      url: paymentUrl,
      amount: paymentUrl.match(/vnp_Amount=(\d+)/)?.[1],
      orderId: paymentUrl.match(/vnp_TxnRef=([^&]+)/)?.[1]
    };

    return Buffer.from(JSON.stringify(qrData)).toString('base64');
  }

  /**
   * Sắp xếp tham số theo thứ tự alphabet
   */
  private sortParams(params: Record<string, string>): Record<string, string> {
    const sortedKeys = Object.keys(params).sort();
    const sortedParams: Record<string, string> = {};
    
    sortedKeys.forEach(key => {
      sortedParams[key] = params[key];
    });

    return sortedParams;
  }

  /**
   * Tạo query string từ tham số
   */
  private buildQueryString(params: Record<string, string>): string {
    return Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
  }

  /**
   * Tạo chữ ký bảo mật
   */
  private createSecureHash(data: string): string {
    return crypto
      .createHmac('sha512', this.config.vnp_HashSecret)
      .update(data)
      .digest('hex');
  }

  /**
   * Format ngày theo định dạng VNPay
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Lấy thông báo lỗi từ mã response
   */
  getErrorMessage(responseCode: string): string {
    const errorMessages: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
    };

    return errorMessages[responseCode] || 'Lỗi không xác định';
  }
}
