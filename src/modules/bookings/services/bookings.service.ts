import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Connection, Brackets } from 'typeorm';
import { Booking } from 'src/shared/schemas/booking.entity';
import { Showtime } from 'src/shared/schemas/showtime.entity';
import { Seat } from 'src/shared/schemas/seat.entity';
import { User } from 'src/shared/schemas/user.entity';
import { CreateBookingDto } from '../dtos/request/create-booking.dto';
import { CancelBookingDto } from '../dtos/request/cancel-booking.dto';
import { AdminFilterBookingDto } from '../dtos/request/admin-filter-booking.dto';
import { FilterBookingDto } from '../dtos/request/filter-booking.dto';
import { BookingSeat } from 'src/shared/schemas/booking-seat.entity';
import { PaymentStatus } from 'src/common/constrants/enums';
import { Payment } from 'src/shared/schemas/payment.entity';
import { BookingRepository } from '../repositories/booking.repository';
import { BookingSeatRepository } from '../repositories/booking-seat.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { TicketPrice } from 'src/shared/schemas/ticket-price.entity';

@Injectable()
export class BookingsService {
  constructor(
    private connection: Connection,

    private readonly bookingRepo: BookingRepository,

    private readonly bookingSeatRepo: BookingSeatRepository,

    @InjectRepository(Showtime)
    private readonly showtimeRepo: Repository<Showtime>,

    private readonly paymentRepo: PaymentRepository,

    @InjectRepository(Seat)
    private readonly seatRepo: Repository<Seat>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(TicketPrice)
    private readonly ticketPriceRepo: Repository<TicketPrice>,
  ) {}

 
  private async getBookedSeats(showtimeId: number): Promise<number[]> {
    const bookings = await this.bookingRepo.find({
      where: { showtimeId: showtimeId },
      relations: ['payments'],
    });

    const validBookingIds = bookings
      .filter((b) => {
        if (!b.payments || b.payments.length === 0) {
          return true;
        }
        return b.payments.some(
          (p) =>
            p.payment_status === PaymentStatus.COMPLETED ||
            p.payment_status === PaymentStatus.PENDING,
        );
      })
      .map((b) => b.id);

    if (validBookingIds.length === 0) {
      return [];
    }

    const bookingSeats = await this.bookingSeatRepo.find({
      where: { bookingId: In(validBookingIds) },
    });

    return bookingSeats.map((bs) => bs.seatId);
  }


  async createBooking(user: any, dto: CreateBookingDto) {
    // Lấy user ID từ JWT token (có thể là user.sub hoặc user.id)
    const userId = user?.id || user?.sub;
    if (!userId) {
      throw new BadRequestException('Không tìm thấy thông tin người dùng');
    }

    // Lấy user từ database để đảm bảo user tồn tại
    const userEntity = await this.userRepo.findOne({ where: { id: userId } });
    if (!userEntity) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${userId}`);
    }

    const showtime = await this.showtimeRepo.findOne({
      where: { id: dto.showtimeId },
      relations: ['screen', 'movie'],
    });
    if (!showtime) {
      throw new NotFoundException('Không tìm thấy suất chiếu');
    }


    if (new Date(showtime.startTime) <= new Date()) {
      throw new BadRequestException('Không thể đặt vé cho suất chiếu đã bắt đầu hoặc đã kết thúc');
    }


    const seats = await this.seatRepo.find({
      where: { id: In(dto.seatIds) },
      relations: ['screen'],
    });

    if (seats.length !== dto.seatIds.length) {
      const foundSeatIds = seats.map((s) => s.id);
      const notFoundSeats = dto.seatIds.filter((id) => !foundSeatIds.includes(id));
      throw new NotFoundException(`Không tìm thấy các ghế: ${notFoundSeats.join(', ')}`);
    }

    // Kiểm tra tất cả ghế có thuộc cùng screen với showtime không
    const wrongScreenSeats = seats.filter((seat) => seat.screenId !== showtime.screenId);
    if (wrongScreenSeats.length > 0) {
      throw new BadRequestException(
        `Các ghế (ID: ${wrongScreenSeats.map((s) => s.id).join(', ')}) không thuộc phòng chiếu của suất chiếu này`,
      );
    }

    // Kiểm tra ghế đã được đặt chưa
    const bookedSeatIds = await this.getBookedSeats(dto.showtimeId);
    const requestedSeats = dto.seatIds;
    const conflictingSeats = requestedSeats.filter((id) =>
      bookedSeatIds.includes(id),
    );

    if (conflictingSeats.length > 0) {
      throw new ConflictException(
        `Các ghế (ID: ${conflictingSeats.join(', ')}) đã được đặt.`,
      );
    }

    // Tính tổng giá dựa trên bảng ticket-prices để luôn đồng bộ
    const showStart = new Date(showtime.startTime);
    // Weekend: Fri(5), Sat(6), Sun(0)
    const isWeekend = [5, 6, 0].includes(showStart.getDay());
    const hh = String(showStart.getHours()).padStart(2, '0');
    const mm = String(showStart.getMinutes()).padStart(2, '0');
    const hhmm = `${hh}:${mm}`;
    const movieType = (showtime.movie as any)?.type;
    let computedTotal = 0;
    for (const seat of seats) {
      const seatPrice =
        seat.price !== undefined && seat.price !== null ? Number(seat.price) : null;
      if (seatPrice !== null && !Number.isNaN(seatPrice) && seatPrice > 0) {
        computedTotal += seatPrice;
      } else {
        const qb = this.ticketPriceRepo.createQueryBuilder('p')
          .where('p.typeSeat = :typeSeat', { typeSeat: seat.type as any })
          .andWhere('p.typeMovie = :typeMovie', { typeMovie: movieType as any })
          .andWhere('p.dayType = :dayType', { dayType: isWeekend as any })
          .andWhere(':t BETWEEN p.startTime AND p.endTime', { t: hhmm });
        const priceRow = await qb.getOne();
        const price = priceRow ? Number((priceRow as any).price) : 0;
        computedTotal += price;
      }
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const newBooking = queryRunner.manager.create(Booking, {
        userId: userId,
        showtimeId: dto.showtimeId,
        totalSeat: dto.seatIds.length,
        totalPriceMovie: computedTotal,
      });
      await queryRunner.manager.save(Booking, newBooking);

      const bookingSeatsData = dto.seatIds.map((seatId) => {
        return queryRunner.manager.create(BookingSeat, {
          bookingId: newBooking.id,
          seatId: seatId,
          quantity: 1,
        });
      });
      await queryRunner.manager.save(BookingSeat, bookingSeatsData);

      await queryRunner.commitTransaction();

      return newBooking;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Đặt vé thất bại', err.message);
    } finally {
      await queryRunner.release();
    }
  }


  async cancelBooking(userId: number, dto: CancelBookingDto) {
    const booking = await this.bookingRepo.findOne({
      where: { id: dto.bookingId },
      relations: ['payments', 'showtime', 'user'],
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy vé');
    }
    if (booking.userId !== userId) {
      throw new BadRequestException('Không phải vé của bạn');
    }

    const hasCompletedPayment = booking.payments.some(
      (p) => p.payment_status === PaymentStatus.COMPLETED,
    );
    if (hasCompletedPayment) {
      throw new BadRequestException('Không thể hủy vé đã thanh toán thành công.');
    }

    if (new Date(booking.showtime.startTime) <= new Date()) {
      throw new BadRequestException(
        'Không thể hủy vé sau khi suất chiếu đã bắt đầu',
      );
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(BookingSeat, { bookingId: booking.id });

      await queryRunner.manager.update(
        Payment,
        { booking: { id: booking.id } },
        { payment_status: PaymentStatus.CANCELLED },
      );

      await queryRunner.manager.delete(Booking, { id: booking.id });

      await queryRunner.commitTransaction();
      return { message: 'Hủy vé thành công' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Hủy vé thất bại', err.message);
    } finally {
      await queryRunner.release();
    }
  }


  async findAdminBookings(filter: AdminFilterBookingDto) {
   
    const page = Number(filter.page) || 1;
    const limit = Number(filter.limit) || 10;
    const { q, status } = filter;

    const skip = (page - 1) * limit; 

    const query = this.bookingRepo.createQueryBuilder('booking');

    query
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.showtime', 'showtime')
      .leftJoinAndSelect('showtime.movie', 'movie')
      .leftJoinAndSelect('booking.payments', 'payment');

    if (q) {
      const qId = Number(q);
      const isValidId = !isNaN(qId) && qId > 0;
      
      query.andWhere(
        new Brackets((qb) => {
          if (isValidId) {
            qb.where('booking.id = :qId', { qId })
              .orWhere('user.email LIKE :q', { q: `%${q}%` })
              .orWhere('user.phone LIKE :q', { q: `%${q}%` })
              .orWhere('movie.title LIKE :q', { q: `%${q}%` });
          } else {
            qb.where('user.email LIKE :q', { q: `%${q}%` })
              .orWhere('user.phone LIKE :q', { q: `%${q}%` })
              .orWhere('movie.title LIKE :q', { q: `%${q}%` });
          }
        }),
      );
    }

    if (status) {
    
      if (status === 'BOOKED') {
       
        query.andWhere(
          'EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :status)',
          { status: PaymentStatus.COMPLETED },
        );
      } else if (status === 'PENDING') {
        
        query.andWhere(
          new Brackets((qb) => {
            qb.where(
              'NOT EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id)',
            )
              .orWhere(
                '(EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :pendingStatus) AND NOT EXISTS (SELECT 1 FROM Payments p2 WHERE p2.booking_id = booking.id AND p2.payment_status = :completedStatus))',
                {
                  pendingStatus: PaymentStatus.PENDING,
                  completedStatus: PaymentStatus.COMPLETED,
                },
              );
          }),
        );
      } else if (status === 'CANCELLED') {
    
        query.andWhere(
          'EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :status)',
          { status: PaymentStatus.CANCELLED },
        );
        query.andWhere(
          'NOT EXISTS (SELECT 1 FROM Payments p2 WHERE p2.booking_id = booking.id AND p2.payment_status = :completedStatus)',
          { completedStatus: PaymentStatus.COMPLETED },
        );
      } else if (status === 'FAILED') {
        // FAILED = có payment với status FAILED và không có COMPLETED
        query.andWhere(
          'EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :status)',
          { status: PaymentStatus.FAILED },
        );
        query.andWhere(
          'NOT EXISTS (SELECT 1 FROM Payments p2 WHERE p2.booking_id = booking.id AND p2.payment_status = :completedStatus)',
          { completedStatus: PaymentStatus.COMPLETED },
        );
      }
    }

    query.orderBy('booking.created_at', 'DESC');
    query.skip(skip).take(limit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit), 
    };
  }

 
  async findAll(userId: number, filter: FilterBookingDto) {
    const { status, page, limit } = filter;

    
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const query = this.bookingRepo.createQueryBuilder('booking');

    query
      .leftJoinAndSelect('booking.showtime', 'showtime')
      .leftJoinAndSelect('showtime.movie', 'movie')
      .leftJoinAndSelect('booking.payments', 'payment')
      .leftJoinAndSelect('booking.bookingSeats', 'bookingSeats')
      .leftJoinAndSelect('bookingSeats.seat', 'seat');

    query.where('booking.userId = :userId', { userId });

    if (status) {
      if (status === 'BOOKED') {
        // BOOKED = có payment với status COMPLETED
        query.andWhere(
          'EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :status)',
          { status: PaymentStatus.COMPLETED },
        );
      } else if (status === 'PENDING') {
        // PENDING = không có payment HOẶC có payment với status PENDING (và không có COMPLETED)
        query.andWhere(
          new Brackets((qb) => {
            qb.where(
              'NOT EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id)',
            )
              .orWhere(
                '(EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :pendingStatus) AND NOT EXISTS (SELECT 1 FROM Payments p2 WHERE p2.booking_id = booking.id AND p2.payment_status = :completedStatus))',
                {
                  pendingStatus: PaymentStatus.PENDING,
                  completedStatus: PaymentStatus.COMPLETED,
                },
              );
          }),
        );
      } else if (status === 'CANCELLED') {
        // CANCELLED = có payment với status CANCELLED và không có COMPLETED
        query.andWhere(
          'EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :status)',
          { status: PaymentStatus.CANCELLED },
        );
        query.andWhere(
          'NOT EXISTS (SELECT 1 FROM Payments p2 WHERE p2.booking_id = booking.id AND p2.payment_status = :completedStatus)',
          { completedStatus: PaymentStatus.COMPLETED },
        );
      } else if (status === 'FAILED') {
        // FAILED = có payment với status FAILED và không có COMPLETED
        query.andWhere(
          'EXISTS (SELECT 1 FROM Payments p WHERE p.booking_id = booking.id AND p.payment_status = :status)',
          { status: PaymentStatus.FAILED },
        );
        query.andWhere(
          'NOT EXISTS (SELECT 1 FROM Payments p2 WHERE p2.booking_id = booking.id AND p2.payment_status = :completedStatus)',
          { completedStatus: PaymentStatus.COMPLETED },
        );
      }
    }

    query.orderBy('booking.created_at', 'DESC');
    query.skip(skip).take(limitNum);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }
}