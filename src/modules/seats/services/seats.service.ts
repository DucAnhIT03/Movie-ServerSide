import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat } from '../../../shared/schemas/seat.entity';
import { Screen } from '../../../shared/schemas/screen.entity';
import { Showtime } from '../../../shared/schemas/showtime.entity';
import { Booking } from '../../../shared/schemas/booking.entity';
import { SeatRepository } from '../repositories/seat.repository';

@Injectable()
export class SeatsService {
  constructor(
    private readonly seatRepository: SeatRepository,
    @InjectRepository(Screen)
    private readonly screenRepository: Repository<Screen>,
    @InjectRepository(Showtime)
    private readonly showtimeRepository: Repository<Showtime>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async findAll(): Promise<Seat[]> {
    return this.seatRepository.find({ 
      relations: ['screen'],
      order: { seatNumber: 'ASC' }
    });
  }

  async create(seatData: Partial<Seat>): Promise<Seat> {
 
    if (seatData.screenId) {
      const screen = await this.screenRepository.findOne({ 
        where: { id: seatData.screenId } 
      });
      if (!screen) {
        throw new NotFoundException(`Không tìm thấy phòng chiếu với ID: ${seatData.screenId}`);
      }
    }

    
    if (seatData.seatNumber && seatData.screenId) {
      const existing = await this.seatRepository.findOne({
        where: {
          seatNumber: seatData.seatNumber,
          screenId: seatData.screenId,
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Ghế ${seatData.seatNumber} đã tồn tại trong phòng chiếu này`,
        );
      }
    }

    if (seatData.price !== undefined && seatData.price !== null) {
      const priceNumber = Number(seatData.price);
      if (Number.isNaN(priceNumber) || priceNumber < 0) {
        throw new BadRequestException('Giá ghế phải là số không âm');
      }
      seatData.price = priceNumber;
    }

    const seat = this.seatRepository.create(seatData);
    return this.seatRepository.save(seat);
  }

  async findOne(id: number): Promise<Seat> {
    const seat = await this.seatRepository.findOne({ 
      where: { id },
      relations: ['screen', 'bookingSeats']
    });
    if (!seat) {
      throw new NotFoundException(`Không tìm thấy ghế với ID: ${id}`);
    }
    return seat;
  }

  async update(id: number, seatData: Partial<Seat>): Promise<Seat> {
    const seat = await this.findOne(id);

    
    if (seatData.screenId && seatData.screenId !== seat.screenId) {
      const screen = await this.screenRepository.findOne({ 
        where: { id: seatData.screenId } 
      });
      if (!screen) {
        throw new NotFoundException(`Không tìm thấy phòng chiếu với ID: ${seatData.screenId}`);
      }
    }

    
    if (seatData.seatNumber && seatData.seatNumber !== seat.seatNumber) {
      const screenId = seatData.screenId || seat.screenId;
      const existing = await this.seatRepository.findOne({
        where: {
          seatNumber: seatData.seatNumber,
          screenId: screenId,
        },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Ghế ${seatData.seatNumber} đã tồn tại trong phòng chiếu này`,
        );
      }
    }

    if (seatData.price !== undefined && seatData.price !== null) {
      const priceNumber = Number(seatData.price);
      if (Number.isNaN(priceNumber) || priceNumber < 0) {
        throw new BadRequestException('Giá ghế phải là số không âm');
      }
      seatData.price = priceNumber;
    }

    Object.assign(seat, seatData);
    return this.seatRepository.save(seat);
  }

  async remove(id: number): Promise<{ message: string }> {
    const seat = await this.findOne(id);

   
    if (seat.bookingSeats && seat.bookingSeats.length > 0) {
      throw new BadRequestException(
        'Không thể xóa ghế đã được đặt. Vui lòng xóa các đặt vé liên quan trước.',
      );
    }

    await this.seatRepository.remove(seat);
    return { message: 'Ghế đã được xóa thành công' };
  }

  async findByShowtime(showtimeId: number): Promise<Array<Seat & { isBooked: boolean }>> {
    // Lấy thông tin showtime để biết screenId
    const showtime = await this.showtimeRepository.findOne({
      where: { id: showtimeId },
      relations: ['screen'],
    });

    if (!showtime) {
      throw new NotFoundException(`Không tìm thấy suất chiếu với ID: ${showtimeId}`);
    }

    // Lấy tất cả ghế trong phòng chiếu
    const seats = await this.seatRepository.find({
      where: { screenId: showtime.screenId },
      relations: ['screen', 'bookingSeats', 'bookingSeats.booking'],
      order: { seatNumber: 'ASC' },
    });

    // Lấy danh sách booking đã thanh toán hoặc đang pending cho showtime này
    const bookings = await this.bookingRepository.find({
      where: { showtimeId },
      relations: ['bookingSeats', 'payments'],
    });

    // Tạo set các ghế đã được đặt (chỉ tính booking có payment thành công hoặc đang pending)
    const bookedSeatIds = new Set<number>();
    bookings.forEach((booking) => {
      const hasPayment = booking.payments && booking.payments.length > 0;
      const isPaid = booking.payments?.some((p) => p.payment_status === 'COMPLETED');
      const isPending = booking.payments?.some((p) => p.payment_status === 'PENDING');
      // Chỉ tính booking đã thanh toán hoặc đang pending (chưa hết hạn)
      // Nếu chưa có payment nào, coi như đang pending (vừa tạo booking)
      if (isPaid || isPending || !hasPayment) {
        booking.bookingSeats?.forEach((bs) => {
          bookedSeatIds.add(bs.seatId);
        });
      }
    });

    // Đánh dấu ghế nào đã được đặt
    return seats.map((seat) => ({
      ...seat,
      isBooked: bookedSeatIds.has(seat.id),
    })) as Array<Seat & { isBooked: boolean }>;
  }
}
