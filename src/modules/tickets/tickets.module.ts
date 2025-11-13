import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TicketsService } from './services/tickets.service';
import { TicketsController } from './controllers/tickets.controller';
import { Booking } from '../../shared/schemas/booking.entity';
import { BookingSeat } from '../../shared/schemas/booking-seat.entity';
import { Payment } from '../../shared/schemas/payment.entity';
import { User } from '../../shared/schemas/user.entity';
import { Showtime } from '../../shared/schemas/showtime.entity';
import { Seat } from '../../shared/schemas/seat.entity';
import { TicketPrice } from '../../shared/schemas/ticket-price.entity';
import { BookingRepository } from './repositories/booking.repository';
import { PaymentRepository } from './repositories/payment.repository';
import { BookingSeatRepository } from './repositories/booking-seat.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, BookingSeat, Payment, User, Showtime, Seat, TicketPrice])],
  controllers: [TicketsController],
  providers: [TicketsService, BookingRepository, PaymentRepository, BookingSeatRepository],
})
export class TicketsModule {}
