import { Injectable } from '@nestjs/common';
import { PaymentMethod } from 'src/common/constrants/enums';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface PaymentGatewayResponse {
  paymentUrl?: string;
  qrCode?: string;
  transactionId?: string;
  expiresAt?: Date;
}

@Injectable()
export class PaymentGatewayService {
  constructor(private configService: ConfigService) {}

  /**
   * Tạo payment URL hoặc QR code cho cổng thanh toán
   */
  async createPaymentRequest(
    method: PaymentMethod,
    amount: number,
    orderId: string,
    orderInfo: string,
    returnUrl: string,
    cancelUrl?: string,
    ipAddress?: string,
  ): Promise<PaymentGatewayResponse> {
    switch (method) {
      case PaymentMethod.VNPAY:
        return this.createVNPayRequest(amount, orderId, orderInfo, returnUrl, ipAddress);
      case PaymentMethod.VIETQR:
        return this.createVietQRRequest(amount, orderId, orderInfo);
      case PaymentMethod.VIETTEL_PAY:
        return this.createViettelPayRequest(amount, orderId, orderInfo);
      case PaymentMethod.PAYPAL:
        return this.createPayPalRequest(amount, orderId, orderInfo, returnUrl, cancelUrl);
      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }
  }

  /**
   * Xác thực callback từ cổng thanh toán
   */
  async verifyCallback(
    method: PaymentMethod,
    callbackData: any,
  ): Promise<{ success: boolean; transactionId: string; amount: number; orderId: string }> {
    switch (method) {
      case PaymentMethod.VNPAY:
        return this.verifyVNPayCallback(callbackData);
      case PaymentMethod.VIETQR:
        return this.verifyVietQRCallback(callbackData);
      case PaymentMethod.VIETTEL_PAY:
        return this.verifyViettelPayCallback(callbackData);
      case PaymentMethod.PAYPAL:
        return this.verifyPayPalCallback(callbackData);
      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }
  }

  /**
   * Tạo VNPay payment request
   */
  private async createVNPayRequest(
    amount: number,
    orderId: string,
    orderInfo: string,
    returnUrl: string,
    ipAddress?: string,
  ): Promise<PaymentGatewayResponse> {
    const vnp_TmnCode = this.configService.get<string>('VNPAY_TMN_CODE') || 'DEMO';
    const vnp_HashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') || 'DEMO_SECRET';
    const vnp_Url = this.configService.get<string>('VNPAY_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const vnp_ReturnUrl = returnUrl || `${this.configService.get<string>('APP_URL')}/payment/callback`;

    const vnp_Params: any = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode,
      vnp_Amount: amount * 100, // VNPay yêu cầu số tiền nhân 100
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl,
      vnp_IpAddr: ipAddress || '127.0.0.1',
      vnp_CreateDate: new Date().toISOString().replace(/[-:]/g, '').split('.')[0],
    };

    // Sắp xếp params và tạo hash
    const sortedParams = this.sortObject(vnp_Params);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    hmac.update(signData);
    vnp_Params.vnp_SecureHash = hmac.digest('hex');

    const paymentUrl = `${vnp_Url}?${new URLSearchParams(vnp_Params).toString()}`;

    return {
      paymentUrl,
      transactionId: orderId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 phút
    };
  }

  /**
   * Tạo VietQR payment request
   */
  private async createVietQRRequest(
    amount: number,
    orderId: string,
    orderInfo: string,
  ): Promise<PaymentGatewayResponse> {
    const accountNo = this.configService.get<string>('VIETQR_ACCOUNT_NO') || '1234567890';
    const accountName = this.configService.get<string>('VIETQR_ACCOUNT_NAME') || 'CINEMA';
    const template = this.configService.get<string>('VIETQR_TEMPLATE') || 'compact2';

    // Tạo QR code data theo format VietQR
    const qrData = {
      accountNo,
      accountName,
      amount,
      addInfo: `${orderId}|${orderInfo}`,
      template,
    };

    // Sử dụng VietQR API để tạo QR code
    const vietQRUrl = 'https://img.vietqr.io/image';
    const qrCodeUrl = `${vietQRUrl}/${accountNo}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(qrData.addInfo)}&accountName=${encodeURIComponent(accountName)}`;

    return {
      qrCode: qrCodeUrl,
      transactionId: orderId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 phút
    };
  }

  /**
   * Tạo Viettel Money payment request
   */
  private async createViettelPayRequest(
    amount: number,
    orderId: string,
    orderInfo: string,
  ): Promise<PaymentGatewayResponse> {
    // Viettel Money thường sử dụng deep link hoặc QR code
    const merchantId = this.configService.get<string>('VIETTEL_MERCHANT_ID') || 'DEMO';
    const qrData = `viettel://payment?merchantId=${merchantId}&amount=${amount}&orderId=${orderId}&description=${encodeURIComponent(orderInfo)}`;

    return {
      qrCode: qrData,
      transactionId: orderId,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    };
  }

  /**
   * Tạo PayPal payment request
   */
  private async createPayPalRequest(
    amount: number,
    orderId: string,
    orderInfo: string,
    returnUrl: string,
    cancelUrl?: string,
  ): Promise<PaymentGatewayResponse> {
    // PayPal integration (cần implement đầy đủ với PayPal SDK)
    const paypalUrl = this.configService.get<string>('PAYPAL_URL') || 'https://www.sandbox.paypal.com/checkoutnow';
    
    return {
      paymentUrl: `${paypalUrl}?token=${orderId}`,
      transactionId: orderId,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 phút
    };
  }

  /**
   * Xác thực VNPay callback
   */
  private async verifyVNPayCallback(callbackData: any): Promise<{
    success: boolean;
    transactionId: string;
    amount: number;
    orderId: string;
  }> {
    const vnp_HashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') || 'DEMO_SECRET';
    const vnp_SecureHash = callbackData.vnp_SecureHash;
    delete callbackData.vnp_SecureHash;
    delete callbackData.vnp_SecureHashType;

    const sortedParams = this.sortObject(callbackData);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    hmac.update(signData);
    const signed = hmac.digest('hex');

    const success = signed === vnp_SecureHash && callbackData.vnp_ResponseCode === '00';

    return {
      success,
      transactionId: callbackData.vnp_TransactionNo || callbackData.vnp_TxnRef,
      amount: (callbackData.vnp_Amount || 0) / 100,
      orderId: callbackData.vnp_TxnRef,
    };
  }

  /**
   * Xác thực VietQR callback
   */
  private async verifyVietQRCallback(callbackData: any): Promise<{
    success: boolean;
    transactionId: string;
    amount: number;
    orderId: string;
  }> {
    // VietQR thường sử dụng webhook hoặc polling
    // Cần implement theo tài liệu VietQR
    return {
      success: callbackData.status === 'success',
      transactionId: callbackData.transactionId || callbackData.orderId,
      amount: callbackData.amount || 0,
      orderId: callbackData.orderId,
    };
  }

  /**
   * Xác thực Viettel Pay callback
   */
  private async verifyViettelPayCallback(callbackData: any): Promise<{
    success: boolean;
    transactionId: string;
    amount: number;
    orderId: string;
  }> {
    return {
      success: callbackData.status === 'SUCCESS',
      transactionId: callbackData.transactionId || callbackData.orderId,
      amount: callbackData.amount || 0,
      orderId: callbackData.orderId,
    };
  }

  /**
   * Xác thực PayPal callback
   */
  private async verifyPayPalCallback(callbackData: any): Promise<{
    success: boolean;
    transactionId: string;
    amount: number;
    orderId: string;
  }> {
    return {
      success: callbackData.status === 'COMPLETED',
      transactionId: callbackData.id || callbackData.orderId,
      amount: parseFloat(callbackData.amount?.value || 0),
      orderId: callbackData.orderId,
    };
  }

  /**
   * Sắp xếp object theo key
   */
  private sortObject(obj: any): any {
    const sorted: any = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = obj[key];
    });
    return sorted;
  }
}

