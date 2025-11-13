import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, IsString, Matches, Min } from 'class-validator';
import { MovieTypeEnum, SeatTypeEnum } from '../../../../common/constrants/enums';

export class UpdateTicketPriceDto {
  @ApiPropertyOptional({ enum: SeatTypeEnum, description: 'Loại ghế' })
  @IsOptional()
  @IsEnum(SeatTypeEnum)
  typeSeat?: SeatTypeEnum;

  @ApiPropertyOptional({ enum: MovieTypeEnum, description: 'Loại phim' })
  @IsOptional()
  @IsEnum(MovieTypeEnum)
  typeMovie?: MovieTypeEnum;

  @ApiPropertyOptional({ description: 'Giá vé (VND)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Loại ngày (false: thường, true: cuối tuần/lễ)' })
  @IsOptional()
  @IsBoolean()
  dayType?: boolean;

  @ApiPropertyOptional({ description: 'Giờ bắt đầu (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
  startTime?: string;

  @ApiPropertyOptional({ description: 'Giờ kết thúc (HH:MM)' })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
  endTime?: string;

  @ApiPropertyOptional({ description: 'ID rạp áp dụng, để trống hoặc null nếu áp dụng toàn bộ rạp' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  theaterId?: number | null;

  @ApiPropertyOptional({ description: 'Áp dụng giá vé cho toàn bộ rạp' })
  @IsOptional()
  @IsBoolean()
  applyToAll?: boolean;
}

