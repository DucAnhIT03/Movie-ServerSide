import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryTicketPriceDto {
  @ApiPropertyOptional({ example: 1, description: 'Trang hiện tại (>=1)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Số bản ghi mỗi trang (1-100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ example: 'STANDARD', description: 'Tìm kiếm theo loại ghế/loại phim/tên rạp' })
  @IsOptional()
  @IsString()
  search?: string;
}

