import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DataConsistencyService {
  constructor(private readonly dataSource: DataSource) {}

  async checkConsistency() {
    const issues: any[] = [];
    const stats: any = {};

    // 1. Kiểm tra Movies và Genres
    const moviesWithoutGenres = await this.dataSource.query(`
      SELECT m.id, m.title, 'Phim không có thể loại' AS issue
      FROM Movies m
      LEFT JOIN Movie_Genre mg ON m.id = mg.movie_id
      WHERE mg.movie_id IS NULL
    `);
    issues.push(...moviesWithoutGenres);

    const invalidMovieGenres = await this.dataSource.query(`
      SELECT mg.movie_id, mg.genre_id, 'Movie_Genre có movie_id không tồn tại' AS issue
      FROM Movie_Genre mg
      LEFT JOIN Movies m ON mg.movie_id = m.id
      WHERE m.id IS NULL
    `);
    issues.push(...invalidMovieGenres);

    const invalidGenreIds = await this.dataSource.query(`
      SELECT mg.movie_id, mg.genre_id, 'Movie_Genre có genre_id không tồn tại' AS issue
      FROM Movie_Genre mg
      LEFT JOIN Genre g ON mg.genre_id = g.id
      WHERE g.id IS NULL
    `);
    issues.push(...invalidGenreIds);

    // 2. Kiểm tra Movies và ShowTimes
    const moviesWithoutShowtimes = await this.dataSource.query(`
      SELECT m.id, m.title, 'Phim không có suất chiếu' AS issue
      FROM Movies m
      LEFT JOIN ShowTimes st ON m.id = st.movie_id
      WHERE st.movie_id IS NULL
    `);
    issues.push(...moviesWithoutShowtimes);

    const invalidShowtimeMovies = await this.dataSource.query(`
      SELECT st.id, st.movie_id, st.screen_id, 'ShowTimes có movie_id không tồn tại' AS issue
      FROM ShowTimes st
      LEFT JOIN Movies m ON st.movie_id = m.id
      WHERE m.id IS NULL
    `);
    issues.push(...invalidShowtimeMovies);

    const invalidShowtimeScreens = await this.dataSource.query(`
      SELECT st.id, st.movie_id, st.screen_id, 'ShowTimes có screen_id không tồn tại' AS issue
      FROM ShowTimes st
      LEFT JOIN Screens s ON st.screen_id = s.id
      WHERE s.id IS NULL
    `);
    issues.push(...invalidShowtimeScreens);

    // 3. Kiểm tra Screens và Theaters
    const invalidScreenTheaters = await this.dataSource.query(`
      SELECT s.id, s.name, s.theater_id, 'Phòng chiếu có theater_id không tồn tại' AS issue
      FROM Screens s
      LEFT JOIN Theaters t ON s.theater_id = t.id
      WHERE t.id IS NULL
    `);
    issues.push(...invalidScreenTheaters);

    // 4. Kiểm tra dữ liệu hợp lệ
    const invalidShowtimes = await this.dataSource.query(`
      SELECT st.id, st.movie_id, st.screen_id, st.start_time, st.end_time, 
             'ShowTimes có end_time < start_time' AS issue
      FROM ShowTimes st
      WHERE st.end_time < st.start_time
    `);
    issues.push(...invalidShowtimes);

    const invalidDurations = await this.dataSource.query(`
      SELECT m.id, m.title, m.duration, 'Phim có duration <= 0' AS issue
      FROM Movies m
      WHERE m.duration <= 0
    `);
    issues.push(...invalidDurations);

    const invalidSeatCapacities = await this.dataSource.query(`
      SELECT s.id, s.name, s.seat_capacity, 'Phòng chiếu có seat_capacity <= 0' AS issue
      FROM Screens s
      WHERE s.seat_capacity <= 0
    `);
    issues.push(...invalidSeatCapacities);

    // 5. Thống kê
    const statsResult = await this.dataSource.query(`
      SELECT 
        'Tổng số phim' AS metric, COUNT(*) AS count FROM Movies
      UNION ALL
      SELECT 'Tổng số thể loại', COUNT(*) FROM Genre
      UNION ALL
      SELECT 'Tổng số rạp', COUNT(*) FROM Theaters
      UNION ALL
      SELECT 'Tổng số phòng chiếu', COUNT(*) FROM Screens
      UNION ALL
      SELECT 'Tổng số suất chiếu', COUNT(*) FROM ShowTimes
      UNION ALL
      SELECT 'Tổng số liên kết Movie-Genre', COUNT(*) FROM Movie_Genre
      UNION ALL
      SELECT 'Phim có thể loại', COUNT(DISTINCT movie_id) FROM Movie_Genre
      UNION ALL
      SELECT 'Phim có suất chiếu', COUNT(DISTINCT movie_id) FROM ShowTimes
    `);

    statsResult.forEach((row: any) => {
      stats[row.metric] = row.count;
    });

    return {
      isConsistent: issues.length === 0,
      issueCount: issues.length,
      issues,
      stats,
    };
  }
}

