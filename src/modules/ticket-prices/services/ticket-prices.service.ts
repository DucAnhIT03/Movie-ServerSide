import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TicketPrice } from '../../../shared/schemas/ticket-price.entity';
import { SeatTypeEnum } from 'src/common/constrants/enums';
import { TicketPriceRepository } from '../repositories/ticket-price.repository';
import { CreateTicketPriceDto } from '../dtos/request/create-ticket-price.dto';
import { QueryTicketPriceDto } from '../dtos/request/query-ticket-price.dto';
import { UpdateTicketPriceDto } from '../dtos/request/update-ticket-price.dto';

@Injectable()
export class TicketPricesService {
  constructor(
    private readonly ticketPriceRepository: TicketPriceRepository,
  ) {}

  // method name getPrice — keeps controller/service consistent
  async getPrice(type_seat: string, type_movie: string, date: Date, time?: string, theaterId?: number): Promise<number | null> {
    // Weekend: Fri(5), Sat(6), Sun(0) to match business rules
    const isWeekend = [5, 6, 0].includes(date.getDay());

    const qb = this.ticketPriceRepository.createQueryBuilder('p');
    qb.where('p.typeSeat = :typeSeat', { typeSeat: type_seat as SeatTypeEnum })
      .andWhere('p.typeMovie = :typeMovie', { typeMovie: type_movie })
      .andWhere('p.dayType = :dayType', { dayType: isWeekend });

    if (typeof theaterId === 'number' && !Number.isNaN(theaterId)) {
      qb.andWhere('(p.theaterId = :theaterId OR p.theaterId IS NULL)', { theaterId });
      qb.orderBy('CASE WHEN p.theaterId IS NULL THEN 1 ELSE 0 END', 'ASC');
    } else {
      qb.andWhere('p.theaterId IS NULL');
    }

    if (time) {
      // Ensure time HH:MM within startTime..endTime
      qb.andWhere(':t BETWEEN p.startTime AND p.endTime', { t: time });
    }

    const ticket = await qb.getOne();
    return ticket ? Number(ticket.price) : null;
  }
  async create(dto: CreateTicketPriceDto): Promise<TicketPrice> {
    this.validateTimeRange(dto.startTime, dto.endTime);
    const theaterId = dto.applyToAll ? null : (dto.theaterId ?? null);

    if (!dto.applyToAll && (theaterId === null || Number.isNaN(theaterId))) {
      throw new BadRequestException('Vui lòng chọn rạp áp dụng hoặc bật áp dụng cho toàn bộ rạp');
    }

    const newTicket = this.ticketPriceRepository.create({
      typeSeat: dto.typeSeat,
      typeMovie: dto.typeMovie,
      price: dto.price,
      dayType: dto.dayType,
      startTime: dto.startTime,
      endTime: dto.endTime,
      theaterId,
    });
    const created = await this.ticketPriceRepository.save(newTicket);
    return this.findById(created.id);
  }

  async list(query: QueryTicketPriceDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 10));

    const qb = this.ticketPriceRepository.createQueryBuilder('ticketPrice')
      .leftJoinAndSelect('ticketPrice.theater', 'theater');
    if (query.search) {
      const search = `%${query.search.toUpperCase()}%`;
      qb.where(
        '(UPPER(ticketPrice.typeSeat) LIKE :search OR UPPER(ticketPrice.typeMovie) LIKE :search OR UPPER(theater.name) LIKE :search)',
        { search },
      );
    }

    qb.orderBy('ticketPrice.created_at', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number) {
    const ticket = await this.ticketPriceRepository.findOne({
      where: { id },
      relations: ['theater'],
    });
    if (!ticket) {
      throw new NotFoundException('Ticket price not found');
    }
    return ticket;
  }

  async update(id: number, dto: UpdateTicketPriceDto) {
    const existing = await this.findById(id);
    if (dto.startTime || dto.endTime) {
      this.validateTimeRange(dto.startTime ?? existing.startTime, dto.endTime ?? existing.endTime);
    }

    const theaterId = dto.applyToAll
      ? null
      : dto.theaterId !== undefined
        ? dto.theaterId
        : existing.theaterId;

    if (!dto.applyToAll && dto.theaterId !== undefined && (dto.theaterId === null || Number.isNaN(dto.theaterId))) {
      throw new BadRequestException('Giá trị theaterId không hợp lệ');
    }

    await this.ticketPriceRepository.update(id, {
      typeSeat: dto.typeSeat ?? existing.typeSeat,
      typeMovie: dto.typeMovie ?? existing.typeMovie,
      price: dto.price ?? existing.price,
      dayType: dto.dayType ?? existing.dayType,
      startTime: dto.startTime ?? existing.startTime,
      endTime: dto.endTime ?? existing.endTime,
      theaterId,
      updated_at: new Date(),
    });
    return this.findById(id);
  }

  async remove(id: number) {
    const existing = await this.findById(id);
    await this.ticketPriceRepository.remove(existing);
    return true;
  }

  private validateTimeRange(start?: string, end?: string) {
    if (!start || !end) return;
    if (start >= end) {
      throw new BadRequestException('endTime must be greater than startTime');
    }
  }
}
