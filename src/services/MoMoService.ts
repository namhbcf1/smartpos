/**
 * MoMo Payment Gateway Service
 * Tích hợp thanh toán MoMo cho ComputerPOS Pro
 */

import crypto from 'node:crypto';

export interface MoMoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
  returnUrl: string;
  notifyUrl: string;
}

export interface MoMoPaymentRequest {
  orderId: string;
  amount: number;
  orderInfo: string;
  extraData?: string;
  requestType?: string;
  autoCapture?: boolean;
}

export interface MoMoResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl?: string;
  qrCodeUrl?: string;
  deeplink?: string;
}

export class MoMoService {
  private config: MoMoConfig;

  constructor(config: MoMoConfig) {
    this.config = config;
  }

  /**
   * Tạo thanh toán MoMo
   */
  async createPayment(request: MoMoPaymentRequest): Promise<MoMoResponse> {
    const requestId = this.generateRequestId();
    const orderId = request.orderId;
    const orderInfo = request.orderInfo;
    const redirectUrl = this.config.returnUrl;
    const ipnUrl = this.config.notifyUrl;
    const amount = request.amount;
    const extraData = request.extraData || '';
    const requestType = request.requestType || 'payWithATM';
    const autoCapture = request.autoCapture !== false;

    // Tạo raw signature
    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.config.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    // Tạo signature
    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.config.partnerCode,
      accessKey: this.config.accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi'
    };

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json() as MoMoResponse;
      
      if (result.resultCode === 0) {
        // Tạo QR code cho thanh toán
        result.qrCodeUrl = await this.generateQRCode(result.payUrl || '');
      }

      return result;
    } catch (error) {
      throw new Error(`MoMo API Error: ${error}`);
    }
  }

  /**
   * Xác thực IPN từ MoMo
   */
  async verifyIPN(ipnData: any): Promise<boolean> {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature
    } = ipnData;

    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

    const expectedSignature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Kiểm tra trạng thái giao dịch
   */
  async queryTransaction(orderId: string): Promise<MoMoResponse> {
    const requestId = this.generateRequestId();
    
    const rawSignature = `accessKey=${this.config.accessKey}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}`;
    
    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.config.partnerCode,
      accessKey: this.config.accessKey,
      requestId,
      orderId,
      signature,
      lang: 'vi'
    };

    try {
      const response = await fetch(`${this.config.endpoint}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      return await response.json() as MoMoResponse;
    } catch (error) {
      throw new Error(`MoMo Query API Error: ${error}`);
    }
  }

  /**
   * Kiểm tra thanh toán thành công
   */
  isPaymentSuccessful(resultCode: number): boolean {
    return resultCode === 0;
  }

  /**
   * Tạo QR code cho thanh toán MoMo
   */
  private async generateQRCode(payUrl: string): Promise<string> {
    // Tạo QR code data cho MoMo
    const qrData = {
      url: payUrl,
      type: 'momo_payment'
    };

    return Buffer.from(JSON.stringify(qrData)).toString('base64');
  }

  /**
   * Tạo request ID duy nhất
   */
  private generateRequestId(): string {
    return `${this.config.partnerCode}_${Date.now()}`;
  }

  /**
   * Lấy thông báo lỗi từ result code
   */
  getErrorMessage(resultCode: number): string {
    const errorMessages: Record<number, string> = {
      0: 'Thành công',
      9000: 'Giao dịch được khởi tạo, chờ người dùng xác nhận thanh toán',
      8000: 'Giao dịch đang được xử lý',
      7000: 'Giao dịch bị từ chối bởi người dùng',
      6000: 'Giao dịch bị từ chối bởi ngân hàng hoặc MoMo',
      5000: 'Giao dịch bị từ chối (Do tài khoản người dùng bị khóa)',
      4000: 'Giao dịch bị từ chối do không đủ số dư',
      3000: 'Giao dịch bị hủy',
      2000: 'Giao dịch thất bại',
      1000: 'Giao dịch thất bại do lỗi hệ thống',
      11: 'Truy cập bị từ chối',
      12: 'Phiên bản API không được hỗ trợ cho yêu cầu này',
      13: 'Xác thực merchant thất bại',
      20: 'Yêu cầu sai định dạng',
      21: 'Số tiền không hợp lệ',
      40: 'RequestId bị trùng',
      41: 'OrderId bị trùng',
      42: 'OrderId không hợp lệ hoặc không được tìm thấy',
      43: 'Yêu cầu bị từ chối do thông tin đơn hàng không hợp lệ'
    };

    return errorMessages[resultCode] || 'Lỗi không xác định';
  }
}
