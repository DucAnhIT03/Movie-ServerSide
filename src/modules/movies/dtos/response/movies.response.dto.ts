import type { MovieEntity } from '../../../../shared/types/movie';
import { ApiProperty } from '@nestjs/swagger';

export class MovieResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() title!: string;
  @ApiProperty({ nullable: true }) descriptions!: string | null;
  @ApiProperty({ nullable: true }) author!: string | null;
  @ApiProperty({ nullable: true }) image!: string | null;
  @ApiProperty({ nullable: true }) trailer!: string | null;
  @ApiProperty({ enum: ['2D', '3D'] }) type!: '2D' | '3D';
  @ApiProperty() duration!: number;
  @ApiProperty() release_date!: Date;
  @ApiProperty({ nullable: true }) end_date!: Date | null;
  @ApiProperty() created_at!: Date;
  @ApiProperty({ nullable: true }) updated_at!: Date | null;
  @ApiProperty({ type: [Object], required: false }) genres?: Array<{ id: number; genreName: string }>;
  @ApiProperty({ type: [Object], required: false }) movieGenres?: any[];

  static fromEntity(e: any): MovieResponseDto {
    const dto = {
      id: e.id,
      title: e.title,
      descriptions: e.descriptions,
      author: e.author,
      image: e.image,
      trailer: e.trailer,
      type: e.type,
      duration: e.duration,
      release_date: e.release_date,
      end_date: e.end_date,
      created_at: e.created_at,
      updated_at: e.updated_at,
    } as MovieResponseDto;

    // Map genres từ movieGenres nếu có
    if (e.movieGenres && Array.isArray(e.movieGenres)) {
      dto.genres = e.movieGenres
        .map((mg: any) => {
          const genre = mg.genre || mg;
          return genre && genre.genreName
            ? { id: genre.id, genreName: genre.genreName }
            : null;
        })
        .filter(Boolean);
    }

    return dto;
  }

  static fromEntities(entities: any[]): MovieResponseDto[] {
    return entities.map(e => this.fromEntity(e));
  }
}

