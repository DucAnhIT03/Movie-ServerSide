import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../shared/schemas/payment.entity';
import { PaymentsService } from 'src/modules/payments/services/payments.service';
import { PaymentGatewayService } from 'src/modules/payments/services/payment-gateway.service';
import { PaymentsController } from './controllers/payments.controller';
import { Booking } from '../../shared/schemas/booking.entity';
import { PaymentRepository } from './repositories/payment.repository';
import { BookingRepository } from './repositories/booking.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Booking])],
  providers: [PaymentsService, PaymentGatewayService, PaymentRepository, BookingRepository],
  controllers: [PaymentsController],
  exports: [PaymentsService, PaymentGatewayService],
})
export class PaymentsModule {}
