import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Brackets } from 'typeorm';
import { Showtime } from 'src/shared/schemas/showtime.entity';
import { Movie } from 'src/shared/schemas/movie.entity';
import { Screen } from 'src/shared/schemas/screen.entity';
import { CreateShowtimeDto } from 'src/modules/showtimes/dtos/request/create-showtime.dto';
import { PaymentStatus } from 'src/common/constrants/enums';
import { ShowtimeRepository } from '../repositories/showtime.repository';

@Injectable()
export class ShowtimesService {
  constructor(
    private readonly showtimeRepo: ShowtimeRepository,
    @InjectRepository(Movie)
    private readonly movieRepo: Repository<Movie>,
    @InjectRepository(Screen)
    private readonly screenRepo: Repository<Screen>,
  ) {}

  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'startTime' | 'endTime' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    movieId?: number;
    screenId?: number;
  }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params?.limit) || 10)); // Max 100 items per page
    const skip = (page - 1) * limit;

    const query = this.showtimeRepo.createQueryBuilder('showtime');

 
    query
      .leftJoinAndSelect('showtime.screen', 'screen')
      .leftJoinAndSelect('showtime.movie', 'movie');

    
    if (params?.search) {
      const searchId = Number(params.search);
      const isValidId = !isNaN(searchId) && searchId > 0;
      
      query.andWhere(
        new Brackets((qb) => {
          if (isValidId) {
            qb.where('showtime.id = :searchId', { searchId })
              .orWhere('movie.title LIKE :search', { search: `%${params.search}%` })
              .orWhere('screen.name LIKE :search', { search: `%${params.search}%` });
          } else {
            qb.where('movie.title LIKE :search', { search: `%${params.search}%` })
              .orWhere('screen.name LIKE :search', { search: `%${params.search}%` });
          }
        }),
      );
    }


    if (params?.movieId) {
      query.andWhere('showtime.movieId = :movieId', { movieId: params.movieId });
    }

  
    if (params?.screenId) {
      query.andWhere('showtime.screenId = :screenId', { screenId: params.screenId });
    }


    const sortBy = params?.sortBy || 'startTime';
    const sortOrder = params?.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    query.orderBy(`showtime.${sortBy}`, sortOrder);

 
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

  async findOne(id: number) {
    const showtime = await this.showtimeRepo.findOne({
      where: { id },
      relations: ['screen', 'movie', 'bookings', 'bookings.payments'],
    });
    if (!showtime) {
      throw new NotFoundException('Không tìm thấy suất chiếu');
    }
    return showtime;
  }

  findByMovie(movieId: number) {
    return this.showtimeRepo.find({
      where: { movieId },
      relations: ['screen'],
      order: { startTime: 'ASC' },
    });
  }

  async findByDate(date: string) {
  
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Định dạng ngày không hợp lệ. Vui lòng sử dụng định dạng YYYY-MM-DD');
    }

    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59`);

    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ');
    }

    return this.showtimeRepo.find({
      where: { startTime: Between(start, end) },
      relations: ['screen', 'movie'],
      order: { startTime: 'ASC' },
    });
  }


  private async checkTimeConflict(
    screenId: number,
    startTime: Date,
    endTime: Date,
    excludeId?: number,
  ): Promise<boolean> {
    const query = this.showtimeRepo
      .createQueryBuilder('showtime')
      .where('showtime.screenId = :screenId', { screenId })
      .andWhere(
        new Brackets((qb) => {

          qb.where(
            '(showtime.startTime < :endTime AND showtime.endTime > :startTime)',
            { startTime, endTime },
          );
        }),
      );

    if (excludeId) {
      query.andWhere('showtime.id != :excludeId', { excludeId });
    }

    const conflicting = await query.getOne();
    return !!conflicting;
  }

  async create(dto: CreateShowtimeDto) {
  
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestException('Định dạng ngày giờ không hợp lệ');
    }

   
    if (endTime <= startTime) {
      throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
    }

 
    // Kiểm tra thời gian bắt đầu phải trong tương lai (ít nhất 1 giờ từ bây giờ)
    const now = new Date();
    const minStartTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 giờ từ bây giờ
    
    if (startTime < minStartTime) {
      const timeDiff = Math.round((minStartTime.getTime() - startTime.getTime()) / (1000 * 60)); // phút
      throw new BadRequestException(
        `Không thể tạo suất chiếu trong quá khứ hoặc quá gần. Thời gian bắt đầu phải ít nhất 1 giờ từ bây giờ. ` +
        `(Thời gian hiện tại: ${now.toISOString()}, Thời gian yêu cầu: ${startTime.toISOString()})`
      );
    }


    const movie = await this.movieRepo.findOne({ where: { id: dto.movieId } });
    if (!movie) {
      throw new NotFoundException(`Không tìm thấy phim với ID: ${dto.movieId}`);
    }

 
    const screen = await this.screenRepo.findOne({ where: { id: dto.screenId } });
    if (!screen) {
      throw new NotFoundException(`Không tìm thấy phòng chiếu với ID: ${dto.screenId}`);
    }


    const hasConflict = await this.checkTimeConflict(dto.screenId, startTime, endTime);
    if (hasConflict) {
      throw new BadRequestException(
        'Phòng chiếu đã có suất chiếu khác trong khoảng thời gian này. Vui lòng chọn thời gian khác.',
      );
    }

    const showtime = this.showtimeRepo.create({
      movieId: dto.movieId,
      screenId: dto.screenId,
      startTime: startTime,
      endTime: endTime,
    });
    return this.showtimeRepo.save(showtime);
  }

  async update(id: number, dto: Partial<CreateShowtimeDto>) {
    const showtime = await this.findOne(id);

    let newStartTime = showtime.startTime;
    let newEndTime = showtime.endTime;
    let newScreenId = showtime.screenId;

    if (dto.startTime && dto.endTime) {
      const startTime = new Date(dto.startTime);
      const endTime = new Date(dto.endTime);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new BadRequestException('Định dạng ngày giờ không hợp lệ');
      }

      if (endTime <= startTime) {
        throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
      }

      newStartTime = startTime;
      newEndTime = endTime;
    } else if (dto.startTime) {
      const startTime = new Date(dto.startTime);
      if (isNaN(startTime.getTime())) {
        throw new BadRequestException('Định dạng ngày giờ không hợp lệ');
      }
      if (showtime.endTime <= startTime) {
        throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
      newStartTime = startTime;
    } else if (dto.endTime) {
      const endTime = new Date(dto.endTime);
      if (isNaN(endTime.getTime())) {
        throw new BadRequestException('Định dạng ngày giờ không hợp lệ');
      }
      if (endTime <= showtime.startTime) {
        throw new BadRequestException('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
      newEndTime = endTime;
    }

   
    if (dto.movieId !== undefined) {
      const movie = await this.movieRepo.findOne({ where: { id: dto.movieId } });
      if (!movie) {
        throw new NotFoundException(`Không tìm thấy phim với ID: ${dto.movieId}`);
      }
      showtime.movieId = dto.movieId;
    }

    
    if (dto.screenId !== undefined) {
      const screen = await this.screenRepo.findOne({ where: { id: dto.screenId } });
      if (!screen) {
        throw new NotFoundException(`Không tìm thấy phòng chiếu với ID: ${dto.screenId}`);
      }
      newScreenId = dto.screenId;
      showtime.screenId = dto.screenId;
    }

    
    if (
      (dto.startTime || dto.endTime || dto.screenId) &&
      (newStartTime.getTime() !== showtime.startTime.getTime() ||
        newEndTime.getTime() !== showtime.endTime.getTime() ||
        newScreenId !== showtime.screenId)
    ) {
      const hasConflict = await this.checkTimeConflict(newScreenId, newStartTime, newEndTime, id);
      if (hasConflict) {
        throw new BadRequestException(
          'Phòng chiếu đã có suất chiếu khác trong khoảng thời gian này. Vui lòng chọn thời gian khác.',
        );
      }
    }

   
    showtime.startTime = newStartTime;
    showtime.endTime = newEndTime;

    return this.showtimeRepo.save(showtime);
  }

  async remove(id: number) {
    const showtime = await this.findOne(id);

   
    if (showtime.bookings && showtime.bookings.length > 0) {
      const hasCompletedPayment = showtime.bookings.some((booking) =>
        booking.payments?.some((payment) => payment.payment_status === PaymentStatus.COMPLETED),
      );
      
      if (hasCompletedPayment) {
        throw new BadRequestException(
          'Không thể xóa suất chiếu đã có đặt vé đã thanh toán thành công. Vui lòng hủy tất cả các đặt vé trước khi xóa.',
        );
      }
      
     
      throw new BadRequestException(
        'Suất chiếu đã có đặt vé. Vui lòng hủy tất cả các đặt vé trước khi xóa.',
      );
    }

    
    if (new Date(showtime.startTime) <= new Date()) {
      throw new BadRequestException('Không thể xóa suất chiếu đã bắt đầu hoặc đã kết thúc');
    }

    await this.showtimeRepo.remove(showtime);
    return { message: 'Xóa suất chiếu thành công' };
  }
}