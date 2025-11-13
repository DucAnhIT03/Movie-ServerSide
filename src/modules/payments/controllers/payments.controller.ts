import { Controller, Post, Body, Get, Param, Patch, UseGuards, Req, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentMethod } from 'src/common/constrants/enums';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from 'src/modules/payments/services/payments.service';
import { CreatePaymentDto } from '../dtos/request/create-payment.dto';
import { CompletePaymentDto } from '../dtos/request/complete-payment.dto';
import { PaymentResponseDto } from '../dtos/response/payments.response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@ApiTags('💳 Thanh toán')
@Controller('payments')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: 'Tạo thanh toán mới',
    description: 'Tạo một giao dịch thanh toán cho vé đã đặt'
  })
  @ApiBody({
    description: 'Thông tin thanh toán',
    type: CreatePaymentDto
  })
  @ApiResponse({ status: 201, description: 'Thanh toán đã được tạo thành công', type: PaymentResponseDto })
  async create(@Req() req: any, @Body() dto: CreatePaymentDto) {
    const requester = req.user as any;
    const isAdmin = Array.isArray(requester?.roles) && requester.roles.includes('ROLE_ADMIN');
    const userId = requester?.id ?? requester?.sub;
    // Lấy IP address từ request
    const ipAddress = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || '127.0.0.1';
    const payment = await this.svc.createPayment(dto.bookingId, dto.method, dto.amount, userId, isAdmin, ipAddress);
    return PaymentResponseDto.fromEntity(payment);
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Webhook thanh toán',
    description: 'Endpoint nhận callback từ cổng thanh toán'
  })
  @ApiBody({
    description: 'Callback data từ cổng thanh toán',
    schema: {
      type: 'object',
      properties: {
        method: { type: 'string', enum: ['VNPAY', 'VIETQR', 'VIETTEL_PAY', 'PAYPAL'] },
        data: { type: 'object' },
      },
    },
  })
  async webhook(@Body() body: { method: string; data: any }) {
    const payment = await this.svc.handleWebhook(body.method as any, body.data);
    return PaymentResponseDto.fromEntity(payment);
  }

  @Get('callback')
  @ApiOperation({
    summary: 'VNPAY Return URL Callback',
    description: 'Endpoint nhận redirect từ VNPAY sau khi thanh toán'
  })
  async vnpayCallback(@Query() query: any, @Res() res: Response) {
    try {
      // VNPAY sẽ redirect về đây với query parameters
      // Xử lý callback từ VNPAY
      const payment = await this.svc.handleWebhook(PaymentMethod.VNPAY, query);
      
      // Redirect đến frontend với kết quả
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const paymentId = payment.id;
      const status = payment.payment_status;
      
      if (status === 'COMPLETED') {
        res.redirect(`${frontendUrl}/payment-success?paymentId=${paymentId}`);
      } else {
        res.redirect(`${frontendUrl}/payment-failure?paymentId=${paymentId}`);
      }
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/payment-failure?error=callback_error`);
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy thông tin thanh toán',
    description: 'Lấy thông tin chi tiết của một giao dịch thanh toán'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID thanh toán' })
  @ApiResponse({ status: 200, description: 'Thông tin thanh toán', type: PaymentResponseDto })
  async getPayment(@Param('id') id: string) {
    const payment = await this.svc.getPayment(Number(id));
    return PaymentResponseDto.fromEntity(payment);
  }

  @Patch(':id/complete')
  @ApiOperation({
    summary: 'Hoàn thành thanh toán',
    description: 'Đánh dấu thanh toán là hoàn thành (dùng cho webhook)'
  })
  @ApiParam({ name: 'id', type: Number, description: 'ID thanh toán' })
  @ApiBody({ type: CompletePaymentDto })
  async completePayment(
    @Param('id') id: string,
    @Body() dto: CompletePaymentDto
  ) {
    return this.svc.completePayment(Number(id), dto.transactionId, dto.success ?? true);
  }
}
