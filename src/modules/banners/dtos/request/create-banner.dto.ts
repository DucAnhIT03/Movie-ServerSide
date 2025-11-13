import {
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BannerType, Position } from '../../../../common/constants/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBannerDto {
  @ApiProperty({ example: 'https://example.com/banner.jpg' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  url: string;

  @ApiProperty({ example: BannerType.IMAGE })
  @IsNotEmpty()
  @IsEnum(BannerType)
  type: BannerType;

  @ApiProperty({ example: Position.Header })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  position: string;
}
