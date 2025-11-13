import { IsArray, IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetGenresDto {
  @ApiProperty({ example: [1, 2, 3], description: 'Danh sách ID thể loại (có thể rỗng để xóa tất cả thể loại)' })
  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  genreIds: number[];
}

