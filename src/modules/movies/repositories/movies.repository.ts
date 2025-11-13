import type { MovieEntity } from '../../../shared/types/movie';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MovieOrmEntity } from '../../../shared/schemas/movie.orm-entity';
import { ShowTimeOrmEntity } from '../../../shared/schemas/showtime.orm-entity';
import { MovieGenre } from '../../../shared/schemas/movie-genre.entity';
import { Genre } from '../../../shared/schemas/genres.entity';

@Injectable()
export class MoviesRepository {
  constructor(
    @InjectRepository(MovieOrmEntity) private readonly repo: Repository<MovieOrmEntity>,
    @InjectRepository(ShowTimeOrmEntity) private readonly showtimeRepo: Repository<ShowTimeOrmEntity>,
    @InjectRepository(MovieGenre) private readonly movieGenreRepo: Repository<MovieGenre>,
    @InjectRepository(Genre) private readonly genreRepo: Repository<Genre>,
  ) {}

  async findAll(): Promise<MovieEntity[]> {
    const rows = await this.repo.find({ order: { release_date: 'DESC' } });
    return rows as unknown as MovieEntity[];
  }

  async findById(id: number): Promise<MovieEntity | null> {
    const row = await this.repo.findOne({ where: { id } });
    return (row as unknown as MovieEntity) ?? null;
  }

  async findNowShowing(now: Date): Promise<MovieEntity[]> {
    // Phim đang chiếu = phim đã phát hành VÀ (chưa có end_date HOẶC end_date >= now) 
    // VÀ (có ít nhất một suất chiếu chưa kết thúc HOẶC chưa có suất chiếu nào)
    
    // Lấy phim có showtime chưa kết thúc
    // Sử dụng subquery để tránh vấn đề với join
    const activeShowtimeMovieIds = await this.showtimeRepo
      .createQueryBuilder('showtime')
      .select('DISTINCT showtime.movie_id', 'movie_id')
      .where('showtime.end_time >= :now', { now })
      .getRawMany()
      .then(results => results.map(r => r.movie_id));

    const moviesWithActiveShowtimes = activeShowtimeMovieIds.length > 0
      ? await this.repo
          .createQueryBuilder('movie')
          .where('movie.id IN (:...movieIds)', { movieIds: activeShowtimeMovieIds })
          .andWhere('movie.release_date <= :now', { now })
          .andWhere('(movie.end_date IS NULL OR movie.end_date >= :now)', { now })
          .getMany()
      : [];

    // Lấy phim chưa có showtime nào (mới thêm, chưa tạo lịch chiếu)
    const allMovieIds = await this.showtimeRepo
      .createQueryBuilder('showtime')
      .select('DISTINCT showtime.movie_id', 'movie_id')
      .getRawMany()
      .then(results => results.map(r => r.movie_id));

    const moviesWithoutShowtimes = await this.repo
      .createQueryBuilder('movie')
      .where('movie.release_date <= :now', { now })
      .andWhere('(movie.end_date IS NULL OR movie.end_date >= :now)', { now })
      .andWhere(allMovieIds.length > 0 
        ? 'movie.id NOT IN (:...movieIds)' 
        : '1=1', 
        allMovieIds.length > 0 ? { movieIds: allMovieIds } : {})
      .getMany();

    // Gộp và loại bỏ trùng lặp
    const allMovies = [...moviesWithActiveShowtimes, ...moviesWithoutShowtimes];
    const uniqueMovies = Array.from(
      new Map(allMovies.map(m => [m.id, m])).values()
    );

    // Load genres cho từng phim
    const movieIds = uniqueMovies.map(m => m.id);
    if (movieIds.length > 0) {
      const movieGenres = await this.movieGenreRepo
        .createQueryBuilder('mg')
        .leftJoinAndSelect('mg.genre', 'genre')
        .where('mg.movieId IN (:...movieIds)', { movieIds })
        .getMany();

      // Gán genres vào từng phim
      uniqueMovies.forEach(movie => {
        (movie as any).movieGenres = movieGenres
          .filter(mg => mg.movieId === movie.id)
          .map(mg => ({
            movieId: mg.movieId,
            genreId: mg.genreId,
            genre: mg.genre
          }));
      });
    }

    // Sắp xếp theo release_date DESC
    uniqueMovies.sort((a, b) => {
      const dateA = new Date(a.release_date).getTime();
      const dateB = new Date(b.release_date).getTime();
      return dateB - dateA;
    });

    return uniqueMovies as unknown as MovieEntity[];
  }

  async findNowShowingDebug(now: Date) {
    // Debug: Kiểm tra chi tiết
    const allMovies = await this.repo.find();
    const allShowtimes = await this.showtimeRepo.find();
    
    const moviesWithActiveShowtimes = await this.repo
      .createQueryBuilder('movie')
      .innerJoin('ShowTimes', 'showtime', 'showtime.movie_id = movie.id')
      .where('movie.release_date <= :now', { now })
      .andWhere('(movie.end_date IS NULL OR movie.end_date >= :now)', { now })
      .andWhere('showtime.end_time >= :now', { now })
      .distinct(true)
      .getMany();

    const moviesWithoutShowtimes = await this.repo
      .createQueryBuilder('movie')
      .leftJoin('ShowTimes', 'showtime', 'showtime.movie_id = movie.id')
      .where('movie.release_date <= :now', { now })
      .andWhere('(movie.end_date IS NULL OR movie.end_date >= :now)', { now })
      .andWhere('showtime.id IS NULL')
      .getMany();

    return {
      currentTime: now,
      allMoviesCount: allMovies.length,
      allShowtimesCount: allShowtimes.length,
      activeShowtimes: allShowtimes.filter(st => new Date(st.end_time) >= now),
      expiredShowtimes: allShowtimes.filter(st => new Date(st.end_time) < now),
      moviesWithActiveShowtimes: moviesWithActiveShowtimes.map(m => ({
        id: m.id,
        title: m.title,
        release_date: m.release_date,
        end_date: m.end_date,
      })),
      moviesWithoutShowtimes: moviesWithoutShowtimes.map(m => ({
        id: m.id,
        title: m.title,
        release_date: m.release_date,
        end_date: m.end_date,
      })),
      allMovies: allMovies.map(m => ({
        id: m.id,
        title: m.title,
        release_date: m.release_date,
        end_date: m.end_date,
        condition: {
          released: new Date(m.release_date) <= now,
          notExpired: !m.end_date || new Date(m.end_date) >= now,
        }
      })),
      allShowtimes: allShowtimes.map(st => ({
        id: st.id,
        movie_id: st.movie_id,
        screen_id: st.screen_id,
        start_time: st.start_time,
        end_time: st.end_time,
        isActive: new Date(st.end_time) >= now,
      })),
    };
  }

  async findComingSoon(now: Date): Promise<MovieEntity[]> {
    // Phim sắp chiếu = phim chưa phát hành HOẶC phim đã phát hành nhưng tất cả suất chiếu đều trong tương lai
    const nowShowingMovies = await this.findNowShowing(now);
    const nowShowingIdSet = new Set(nowShowingMovies.map(m => m.id));

    // Phim chưa phát hành
    const futureReleaseMovies = await this.repo
      .createQueryBuilder('movie')
      .where('movie.release_date > :now', { now })
      .getMany();

    // Phim đã phát hành nhưng tất cả suất chiếu đều trong tương lai (loại trừ phim đang chiếu)
    const futureShowtimeMovies = await this.repo
      .createQueryBuilder('movie')
      .innerJoin('ShowTimes', 'showtime', 'showtime.movie_id = movie.id')
      .where('movie.release_date <= :now', { now })
      .andWhere('showtime.start_time > :now', { now })
      .andWhere('movie.id NOT IN (:...nowShowingIds)', {
        nowShowingIds: nowShowingIdSet.size > 0 ? Array.from(nowShowingIdSet) : [0],
      })
      .distinct(true)
      .getMany();

    // Gộp tất cả phim sắp chiếu
    const allComingSoonIds = new Set([
      ...futureReleaseMovies.map(m => m.id),
      ...futureShowtimeMovies.map(m => m.id),
    ]);

    if (allComingSoonIds.size === 0) {
      return [];
    }

    const allComingSoon = await this.repo
      .createQueryBuilder('movie')
      .where('movie.id IN (:...ids)', { ids: Array.from(allComingSoonIds) })
      .orderBy('movie.release_date', 'ASC')
      .getMany();

    return allComingSoon as unknown as MovieEntity[];
  }
}

