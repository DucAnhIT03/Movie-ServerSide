import { IsOptional, IsString, IsInt, IsEnum, IsBoolean, MaxLength, Min, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SeatTypeEnum } from '../../../../common/constrants/enums';
import { Type } from 'class-transformer';

export class UpdateSeatDto {
  @ApiPropertyOptional({ example: 1, description: 'ID phòng chiếu' })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Screen ID phải là số nguyên dương' })
  screenId?: number;

  @ApiPropertyOptional({ example: 'A1', description: 'Số ghế', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Số ghế không được vượt quá 50 ký tự' })
  seatNumber?: string;

  @ApiPropertyOptional({ 
    example: 'VIP', 
    description: 'Loại ghế',
    enum: SeatTypeEnum
  })
  @IsOptional()
  @IsEnum(SeatTypeEnum, { message: 'Loại ghế phải là STANDARD, VIP hoặc SWEETBOX' })
  type?: SeatTypeEnum;

  @ApiPropertyOptional({ example: true, description: 'Ghế có thể thay đổi được không' })
  @IsOptional()
  @IsBoolean()
  isVariable?: boolean;

  @ApiPropertyOptional({ example: 180000, description: 'Giá ghế (VND)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá ghế phải là số' })
  @Min(0, { message: 'Giá ghế phải >= 0' })
  price?: number;
}

