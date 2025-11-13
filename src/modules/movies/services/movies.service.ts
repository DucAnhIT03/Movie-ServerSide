import { Injectable } from '@nestjs/common';
import { MoviesRepository } from '../repositories/movies.repository';
import type { MovieEntity } from '../../../shared/types/movie';

@Injectable()
export class MoviesService {
  constructor(private readonly moviesRepo: MoviesRepository) {}

  async findNowShowing(): Promise<MovieEntity[]> {
    const now = new Date();
    return this.moviesRepo.findNowShowing(now);
  }

  async findComingSoon(): Promise<MovieEntity[]> {
    const now = new Date();
    return this.moviesRepo.findComingSoon(now);
  }

  async findAll(): Promise<MovieEntity[]> {
    return this.moviesRepo.findAll();
  }

  async findOne(id: number): Promise<MovieEntity | null> {
    return this.moviesRepo.findById(id);
  }

  async findNowShowingDebug() {
    const now = new Date();
    return this.moviesRepo.findNowShowingDebug(now);
  }
}

