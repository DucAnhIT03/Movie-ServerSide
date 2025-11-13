import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Payment } from 'src/shared/schemas/payment.entity';
import { PaymentStatus, PaymentMethod } from 'src/common/constrants/enums';
import { PaymentRepository } from '../repositories/payment.repository';
import { BookingRepository } from '../repositories/booking.repository';
import { PaymentGatewayService } from './payment-gateway.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly bookingRepo: BookingRepository,
    private readonly gatewayService: PaymentGatewayService,
    private readonly configService: ConfigService,
  ) {}

  async createPayment(bookingId: number, method: PaymentMethod, amount: number, requesterUserId?: number, isAdmin: boolean = false, ipAddress?: string) {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId }, relations: ['payments', 'showtime'] });
    if (!booking) throw new NotFoundException('Booking not found');

    if (!isAdmin && requesterUserId && booking.userId !== requesterUserId) {
      throw new ForbiddenException('Bạn không có quyền tạo thanh toán cho vé này');
    }

    if (new Date((booking as any).showtime.startTime) <= new Date()) {
      throw new BadRequestException('Suất chiếu đã bắt đầu hoặc kết thúc');
    }

    const hasCompleted = ((booking as any).payments || []).some((p: any) => p.payment_status === PaymentStatus.COMPLETED);
    if (hasCompleted) {
      throw new BadRequestException('Vé đã được thanh toán thành công');
    }

    if (typeof amount === 'number' && amount !== Number(booking.totalPriceMovie)) {
      throw new BadRequestException('Số tiền thanh toán không khớp với tổng vé');
    }

    const payment = this.paymentRepo.create({
      booking,
      payment_method: method,
      payment_status: PaymentStatus.PENDING,
      amount,
    });

    const savedPayment = await this.paymentRepo.save(payment);

    // Tạo payment request với gateway
    try {
      const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';
      const returnUrl = `${appUrl}/payment/callback?paymentId=${savedPayment.id}`;
      const orderInfo = `Thanh toan ve phim - Booking #${booking.id}`;
      
      const gatewayResponse = await this.gatewayService.createPaymentRequest(
        method,
        amount,
        `PAYMENT_${savedPayment.id}_${Date.now()}`,
        orderInfo,
        returnUrl,
        undefined,
        ipAddress,
      );

      // Lưu transaction ID và payment URL/QR code vào payment
      if (gatewayResponse.transactionId) {
        savedPayment.transaction_id = gatewayResponse.transactionId;
      }
      
      // Lưu payment URL hoặc QR code vào một field tạm (có thể tạo thêm field trong entity)
      (savedPayment as any).payment_url = gatewayResponse.paymentUrl;
      (savedPayment as any).qr_code = gatewayResponse.qrCode;
      (savedPayment as any).expires_at = gatewayResponse.expiresAt;

      await this.paymentRepo.save(savedPayment);
    } catch (error) {
      console.error('Error creating payment gateway request:', error);
      // Không throw error để payment vẫn được tạo
    }

    return savedPayment;
  }

  async completePayment(
    paymentId: number,
    transactionId: string,
    success = true,
  ) {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['booking'],
    });

    if (!payment) throw new NotFoundException('Payment not found');

    payment.transaction_id = transactionId;
    payment.payment_status = success
      ? PaymentStatus.COMPLETED
      : PaymentStatus.FAILED;
    (payment as any).payment_time = new Date();

    await this.paymentRepo.save(payment);


    return payment;
  }

  async getPayment(id: number) {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: ['booking', 'booking.user', 'booking.showtime', 'booking.bookingSeats'],
    });

    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  /**
   * Xử lý webhook callback từ cổng thanh toán
   */
  async handleWebhook(method: PaymentMethod, callbackData: any): Promise<Payment> {
    try {
      const verification = await this.gatewayService.verifyCallback(method, callbackData);
      
      if (!verification.success) {
        throw new BadRequestException('Payment verification failed');
      }

      // Tìm payment theo orderId
      // orderId format: PAYMENT_{paymentId}_{timestamp}
      let paymentId: number | null = null;
      if (verification.orderId.startsWith('PAYMENT_')) {
        const parts = verification.orderId.replace('PAYMENT_', '').split('_');
        paymentId = parseInt(parts[0]);
      }
      
      const payment = await this.paymentRepo.findOne({
        where: [
          ...(paymentId ? [{ id: paymentId }] : []),
          { transaction_id: verification.transactionId },
        ],
        relations: ['booking'],
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Cập nhật trạng thái thanh toán
      payment.transaction_id = verification.transactionId;
      payment.payment_status = PaymentStatus.COMPLETED;
      (payment as any).payment_time = new Date();

      await this.paymentRepo.save(payment);

      return payment;
    } catch (error) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }
}