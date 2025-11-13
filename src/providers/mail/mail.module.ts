import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailService } from './mail.service.js';
import { MailController } from './mail.controller.js';
import { MailDebugController } from './mail-debug.controller.js';
import { QueueModule } from '../queue/queue.module.js';
import { EmailLog } from 'src/shared/schemas/email-log.entity';
import { EmailReminderScheduler } from './scheduler/email-reminder.scheduler';
import { Booking } from 'src/shared/schemas/booking.entity';
import { Movie } from 'src/shared/schemas/movie.entity';
import { ScreenOrmEntity } from 'src/shared/schemas/screen.orm-entity';

@Module({
  imports: [
    forwardRef(() => QueueModule),
    TypeOrmModule.forFeature([EmailLog, Booking, Movie, ScreenOrmEntity]),
  ],
  controllers: [MailController, MailDebugController],
  providers: [MailService, EmailReminderScheduler],
  exports: [MailService],
})
export class MailModule {}


