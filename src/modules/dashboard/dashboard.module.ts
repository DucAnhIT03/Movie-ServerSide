import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardService } from './services/dashboard.service';
import { DataConsistencyService } from './services/data-consistency.service';
import { Users } from '../../shared/schemas/users.entity';
import { TheaterOrmEntity } from '../../shared/schemas/theater.orm-entity';
import { ScreenOrmEntity } from '../../shared/schemas/screen.orm-entity';
import { MovieOrmEntity } from '../../shared/schemas/movie.orm-entity';
import { ShowTimeOrmEntity } from '../../shared/schemas/showtime.orm-entity';
import { Booking } from '../../shared/schemas/booking.entity';
import { Payment } from '../../shared/schemas/payment.entity';
import { EmailLog } from '../../shared/schemas/email-log.entity';
import { QueueModule } from '../../providers/queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Users,
      TheaterOrmEntity,
      ScreenOrmEntity,
      MovieOrmEntity,
      ShowTimeOrmEntity,
      Booking,
      Payment,
      EmailLog,
    ]),
    forwardRef(() => QueueModule),
  ],
  controllers: [DashboardController],
  providers: [DashboardService, DataConsistencyService],
  exports: [DashboardService],
})
export class DashboardModule {}



