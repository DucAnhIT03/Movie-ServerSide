import type { FestivalEntity } from '../../../../shared/types/festival';
import { ApiProperty } from '@nestjs/swagger';

export class FestivalResponseDto {
  @ApiProperty()
  id!: number;
  @ApiProperty()
  title!: string;
  @ApiProperty({ nullable: true })
  image!: string | null;
  @ApiProperty()
  start_time!: Date;
  @ApiProperty()
  end_time!: Date;

  static fromEntity(e: FestivalEntity): FestivalResponseDto {
    return { ...e } as FestivalResponseDto;
  }
}


