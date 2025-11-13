import { ApiProperty } from '@nestjs/swagger';

export class BannerResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty()
  position!: string;

  @ApiProperty({ nullable: true })
  created_at?: Date;

  static fromEntity(entity: any): BannerResponseDto {
    return {
      id: entity.id,
      url: entity.url,
      type: entity.type,
      position: entity.position,
      created_at: entity.created_at,
    } as BannerResponseDto;
  }
}

