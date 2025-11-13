import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from 'src/shared/schemas/booking.entity';
import { Movie } from 'src/shared/schemas/movie.entity';
import { ScreenOrmEntity } from 'src/shared/schemas/screen.orm-entity';
import { QueueService } from '../../queue/queue.service';

@Injectable()
export class EmailReminderScheduler {
  private readonly logger = new Logger(EmailReminderScheduler.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,
    @InjectRepository(ScreenOrmEntity)
    private readonly screenRepo: Repository<ScreenOrmEntity>,
    private readonly queueService: QueueService,
  ) {}

 
  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleShowtimeReminders() {
    this.logger.log('Checking for showtime reminders...');

    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000); 
    const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000); 

    try {
      
      const bookings2h = await this.bookingRepo
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.showtime', 'showtime')
        .leftJoinAndSelect('booking.user', 'user')
        .leftJoinAndSelect('booking.bookingSeats', 'bookingSeats')
        .leftJoinAndSelect('bookingSeats.seat', 'seat')
        .where('showtime.startTime <= :twoHoursLater', { twoHoursLater })
        .andWhere('showtime.startTime > :now', { now })
        .getMany();

     
      const bookings1d = await this.bookingRepo
        .createQueryBuilder('booking')
        .leftJoinAndSelect('booking.showtime', 'showtime')
        .leftJoinAndSelect('booking.user', 'user')
        .leftJoinAndSelect('booking.bookingSeats', 'bookingSeats')
        .leftJoinAndSelect('bookingSeats.seat', 'seat')
        .where('showtime.startTime <= :oneDayLater', { oneDayLater })
        .andWhere('showtime.startTime > :twoHoursLater', { twoHoursLater })
        .getMany();

      
      for (const booking of bookings2h) {
        if (booking.showtime && booking.user && booking.bookingSeats) {
          const timeUntilShow = Math.round((booking.showtime.startTime.getTime() - now.getTime()) / (60 * 60 * 1000));
          if (timeUntilShow <= 2 && timeUntilShow > 0) {
            await this.sendReminderEmail(booking, '2 giờ');
          }
        }
      }

     
      for (const booking of bookings1d) {
        if (booking.showtime && booking.user && booking.bookingSeats) {
          const timeUntilShow = Math.round((booking.showtime.startTime.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          if (timeUntilShow <= 1 && timeUntilShow > 0) {
            await this.sendReminderEmail(booking, '1 ngày');
          }
        }
      }

      this.logger.log(`Processed ${bookings2h.length} bookings for 2h reminder, ${bookings1d.length} for 1d reminder`);
    } catch (error) {
      this.logger.error('Error processing showtime reminders:', error);
    }
  }

  private async sendReminderEmail(booking: Booking, reminderTime: string) {
    try {
      const showtime = booking.showtime;
      const user = booking.user;
      const seats = booking.bookingSeats.map(bs => bs.seat?.seatNumber || '').filter(Boolean);

      if (!showtime || !user || !user.email) {
        return;
      }

     
      const movie = await this.movieRepo.findOne({ where: { id: showtime.movieId } });
      
   
      const screen = await this.screenRepo.findOne({ 
        where: { id: showtime.screenId },
        relations: ['theater'],
      });

      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Khách hàng';
      const movieTitle = movie?.title || 'N/A';
      const theaterName = screen?.theater?.name || 'N/A';
      const screenName = screen?.name || 'N/A';

      const delayMs = showtime.startTime.getTime() - new Date().getTime() - (reminderTime.includes('giờ') ? 2 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
      
      const emailData = {
        to: user.email,
        userName: userName,
        bookingId: booking.id,
        movieTitle: movieTitle,
        theaterName: theaterName,
        screenName: screenName,
        showTime: showtime.startTime,
        seats: seats,
        reminderTime: reminderTime,
      };

      if (delayMs > 0) {
 
        await this.queueService.enqueueShowtimeReminderEmail(emailData, delayMs);
      } else {
    
        await this.queueService.enqueueShowtimeReminderEmail(emailData);
      }

      this.logger.log(`Reminder email queued for booking ${booking.id} (${reminderTime} before showtime)`);
    } catch (error) {
      this.logger.error(`Failed to queue reminder email for booking ${booking.id}:`, error);
    }
  }
}

