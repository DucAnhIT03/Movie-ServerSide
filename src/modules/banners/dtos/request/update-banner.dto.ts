import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BannerType } from '../../../../common/constants/enums';

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  url?: string;

  @IsOptional()
  @IsEnum(BannerType)
  type?: BannerType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  position?: string;
}
