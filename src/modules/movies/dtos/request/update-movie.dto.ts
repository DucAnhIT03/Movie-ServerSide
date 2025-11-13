import {
  IsOptional,
  IsString,
  MaxLength,
  IsIn,
  IsInt,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMovieDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'The Great Adventure', description: 'Tên phim' })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'An action movie about ...', description: 'Mô tả phim' })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({ example: 'John Doe', description: 'Tác giả/Đạo diễn' })
  author?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'https://example.com/poster.jpg', description: 'URL hình ảnh poster' })
  image?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=...', description: 'URL trailer' })
  trailer?: string;

  @IsOptional()
  @IsIn(['2D', '3D'])
  @ApiPropertyOptional({ example: '2D', description: 'Loại phim (2D hoặc 3D)' })
  type?: string;

  @IsOptional()
  @IsInt()
  @ApiPropertyOptional({ example: 120, description: 'Thời lượng phim (phút)' })
  duration?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày phát hành phải là định dạng ngày giờ hợp lệ (ISO 8601)' })
  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z', description: 'Ngày phát hành phim' })
  releaseDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc phải là định dạng ngày giờ hợp lệ (ISO 8601)' })
  @ApiPropertyOptional({ example: '2025-02-01T00:00:00.000Z', description: 'Ngày kết thúc chiếu phim (tùy chọn)' })
  endDate?: string;
}

