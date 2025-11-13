import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsIn,
  IsInt,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ example: 'The Great Adventure' })
  title: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'An action movie about ...' })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({ example: 'John Doe' })
  author?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'https://example.com/poster.jpg' })
  image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=...' })
  trailer?: string;

  @IsOptional()
  @IsIn(['2D', '3D'])
  @ApiPropertyOptional({ example: '2D' })
  type?: string;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ example: 120 })
  duration?: number;

  @IsNotEmpty()
  @IsDateString({}, { message: 'Ngày phát hành phải là định dạng ngày giờ hợp lệ (ISO 8601)' })
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: 'Ngày phát hành phim' })
  releaseDate: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc phải là định dạng ngày giờ hợp lệ (ISO 8601)' })
  @ApiPropertyOptional({ example: '2025-02-01T00:00:00.000Z', description: 'Ngày kết thúc chiếu phim (tùy chọn)' })
  endDate?: string;
}

