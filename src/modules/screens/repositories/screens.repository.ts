import type { ScreenEntity } from '../../../shared/types/screen';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { ScreenOrmEntity } from '../../../shared/schemas/screen.orm-entity';

@Injectable()
export class ScreensRepository {
  constructor(@InjectRepository(ScreenOrmEntity) private readonly repo: Repository<ScreenOrmEntity>) {}

  async findAndCount(params: { 
    page: number; 
    limit: number; 
    search?: string; 
    theater_id?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{ items: ScreenEntity[]; total: number }> {
    const query = this.repo.createQueryBuilder('screen');
    
    if (params.search) {
      const searchId = Number(params.search);
      const isValidId = !isNaN(searchId) && searchId > 0;
      
      query.where(
        new Brackets((qb) => {
          if (isValidId) {
            qb.where('screen.id = :searchId', { searchId })
              .orWhere('screen.name LIKE :search', { search: `%${params.search}%` });
          } else {
            qb.where('screen.name LIKE :search', { search: `%${params.search}%` });
          }
        }),
      );
    }

    if (params.theater_id) {
      query.andWhere('screen.theater_id = :theaterId', { theaterId: params.theater_id });
    }

    // Sort
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder?.toUpperCase() || 'DESC';
    const validSortColumns = ['id', 'name', 'seat_capacity', 'theater_id', 'created_at', 'updated_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    
    query.orderBy(`screen.${sortColumn}`, sortOrder as 'ASC' | 'DESC');
    
    // Pagination
    query.skip((params.page - 1) * params.limit).take(params.limit);
    
    const [rows, total] = await query.getManyAndCount();
    return { items: rows as unknown as ScreenEntity[], total };
  }

  async create(data: Omit<ScreenEntity, 'id' | 'created_at' | 'updated_at'>): Promise<ScreenEntity> {
    const created = await this.repo.save(this.repo.create(data as any));
    return created as unknown as ScreenEntity;
  }

  async findByTheaterId(theaterId: number): Promise<ScreenEntity[]> {
    const rows = await this.repo.find({ where: { theater_id: theaterId } as any });
    return rows as unknown as ScreenEntity[];
  }

  async findById(id: number): Promise<ScreenEntity | null> {
    const row = await this.repo.findOne({ where: { id } });
    return (row as unknown as ScreenEntity) ?? null;
  }

  async update(id: number, data: Partial<Omit<ScreenEntity, 'id' | 'created_at'>>): Promise<ScreenEntity> {
    await this.repo.update({ id }, { ...(data as any), updated_at: new Date() });
    const row = await this.repo.findOne({ where: { id } });
    return row as unknown as ScreenEntity;
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete({ id });
  }
}



