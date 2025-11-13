import { ApiProperty } from '@nestjs/swagger';

export class SeatResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  screenId!: number;

  @ApiProperty()
  seatNumber!: string;

  @ApiProperty()
  isVariable!: boolean;

  @ApiProperty()
  type!: string;

  @ApiProperty({ nullable: true })
  price?: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ nullable: true })
  updatedAt?: Date;

  static fromEntity(entity: any): SeatResponseDto {
    return {
      id: entity.id,
      screenId: entity.screenId,
      seatNumber: entity.seatNumber,
      isVariable: entity.isVariable,
      type: entity.type,
      price: entity.price,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    } as SeatResponseDto;
  }
}

