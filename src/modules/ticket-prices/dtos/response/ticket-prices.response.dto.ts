import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TicketPriceResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  typeSeat!: string;

  @ApiProperty()
  typeMovie!: string;

  @ApiProperty()
  price!: number;

  @ApiProperty()
  dayType!: boolean;

  @ApiProperty()
  startTime!: string;

  @ApiProperty()
  endTime!: string;

  @ApiPropertyOptional({ nullable: true })
  theaterId?: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Thông tin rạp áp dụng giá vé' })
  theater?: {
    id: number;
    name: string;
    location?: string;
    phone?: string;
  } | null;

  @ApiPropertyOptional({ description: 'Giá vé áp dụng cho toàn bộ rạp' })
  applyToAll?: boolean;

  @ApiProperty({ required: false })
  createdAt?: Date;

  @ApiProperty({ required: false, nullable: true })
  updatedAt?: Date | null;

  static fromEntity(entity: any): TicketPriceResponseDto {
    return {
      id: entity.id,
      typeSeat: entity.typeSeat,
      typeMovie: entity.typeMovie,
      price: entity.price,
      dayType: entity.dayType,
      startTime: entity.startTime,
      endTime: entity.endTime,
      theaterId: entity.theaterId ?? null,
      theater: entity.theater
        ? {
            id: entity.theater.id,
            name: entity.theater.name,
            location: entity.theater.location,
            phone: entity.theater.phone,
          }
        : null,
      applyToAll: entity.theaterId == null,
      createdAt: entity.created_at ?? entity.createdAt,
      updatedAt: entity.updated_at ?? entity.updatedAt,
    } as TicketPriceResponseDto;
  }
}

