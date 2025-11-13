import { IsNotEmpty, IsString, IsInt, IsEnum, IsBoolean, IsOptional, MaxLength, Min, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SeatTypeEnum } from '../../../../common/constrants/enums';
import { Type } from 'class-transformer';

export class CreateSeatDto {
  @ApiProperty({ example: 1, description: 'ID phòng chiếu' })
  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Screen ID phải là số nguyên dương' })
  screenId: number;

  @ApiProperty({ example: 'A1', description: 'Số ghế', maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50, { message: 'Số ghế không được vượt quá 50 ký tự' })
  seatNumber: string;

  @ApiProperty({ 
    example: 'STANDARD', 
    description: 'Loại ghế',
    enum: SeatTypeEnum
  })
  @IsNotEmpty()
  @IsEnum(SeatTypeEnum, { message: 'Loại ghế phải là STANDARD, VIP hoặc SWEETBOX' })
  type: SeatTypeEnum;

  @ApiPropertyOptional({ example: false, description: 'Ghế có thể thay đổi được không', default: false })
  @IsOptional()
  @IsBoolean()
  isVariable?: boolean;

  @ApiPropertyOptional({ example: 150000, description: 'Giá ghế (VND)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Giá ghế phải là số' })
  @Min(0, { message: 'Giá ghế phải >= 0' })
  price?: number;
}

