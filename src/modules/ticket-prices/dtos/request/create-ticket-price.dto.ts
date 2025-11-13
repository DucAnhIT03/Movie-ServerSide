import { IsNotEmpty, IsEnum, IsNumber, IsString, Min, IsBoolean, Matches, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SeatTypeEnum, MovieTypeEnum } from '../../../../common/constrants/enums';

export class CreateTicketPriceDto {
  @ApiProperty({ 
    example: SeatTypeEnum.STANDARD, 
    description: 'Loại ghế',
    enum: SeatTypeEnum
  })
  @IsNotEmpty()
  @IsEnum(SeatTypeEnum, { message: 'Loại ghế phải là STANDARD, VIP hoặc SWEETBOX' })
  typeSeat: SeatTypeEnum;

  @ApiProperty({ 
    example: MovieTypeEnum['2D'], 
    description: 'Loại phim',
    enum: MovieTypeEnum
  })
  @IsNotEmpty()
  @IsEnum(MovieTypeEnum, { message: 'Loại phim phải là 2D hoặc 3D' })
  typeMovie: MovieTypeEnum;

  @ApiProperty({ example: 150000, description: 'Giá vé (VND)' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Giá vé phải >= 0' })
  price: number;

  @ApiProperty({ example: false, description: 'Loại ngày: false = ngày thường, true = cuối tuần' })
  @IsNotEmpty()
  @IsBoolean()
  dayType: boolean;

  @ApiPropertyOptional({ description: 'ID rạp áp dụng giá vé. Bỏ trống hoặc null nếu áp dụng cho tất cả các rạp.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  theaterId?: number | null;

  @ApiPropertyOptional({ description: 'Áp dụng cho toàn bộ rạp', default: false })
  @IsOptional()
  @IsBoolean()
  applyToAll?: boolean;

  @ApiProperty({ example: '08:00', description: 'Giờ bắt đầu (HH:MM)' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Định dạng giờ phải là HH:MM (24h)' })
  startTime: string;

  @ApiProperty({ example: '23:59', description: 'Giờ kết thúc (HH:MM)' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Định dạng giờ phải là HH:MM (24h)' })
  endTime: string;
}

