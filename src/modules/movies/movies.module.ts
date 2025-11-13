import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesController } from './controllers/movies.controller';
import { MoviesService } from './services/movies.service';
import { MoviesRepository } from './repositories/movies.repository';
import { MovieOrmEntity } from '../../shared/schemas/movie.orm-entity';
import { ShowTimeOrmEntity } from '../../shared/schemas/showtime.orm-entity';
import { MovieGenre } from '../../shared/schemas/movie-genre.entity';
import { Genre } from '../../shared/schemas/genres.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MovieOrmEntity, ShowTimeOrmEntity, MovieGenre, Genre])],
  controllers: [MoviesController],
  providers: [MoviesService, MoviesRepository],
  exports: [MoviesService, MoviesRepository],
})
export class MoviesModule {}

