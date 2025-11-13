import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBannerDto } from '../dtos/request/create-banner.dto';
import { UpdateBannerDto } from '../dtos/request/update-banner.dto';
import { BannerRepository } from '../repositories/banner.repository';

@Injectable()
export class BannerService {
  constructor(private bannersRepo: BannerRepository) {}

  async create(dto: CreateBannerDto) {
    const banner = this.bannersRepo.create(dto as any);
    return this.bannersRepo.save(banner);
  }

  async findOne(id: number) {
    const b = await this.bannersRepo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Banner not found');
    return b;
  }

  async update(id: number, dto: UpdateBannerDto) {
    const banner = await this.bannersRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    Object.assign(banner, dto);
    return this.bannersRepo.save(banner);
  }

  async remove(id: number) {
    const banner = await this.bannersRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    await this.bannersRepo.remove(banner);
    return { success: true };
  }

  async searchAndPaginate(search?: string, page = 1, limit = 2) {
    const queryBuilder = this.bannersRepo.createQueryBuilder('banner');
    
    if (search && search.trim()) {
      queryBuilder.where(
        'banner.position LIKE :search OR banner.url LIKE :search',
        { search: `%${search.trim()}%` }
      );
    }
    
    queryBuilder
      .orderBy('banner.id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);
    
    const [items, total] = await queryBuilder.getManyAndCount();
    
    return {
      items,
      meta: { total, page, limit, pageCount: Math.ceil(total / limit) },
    };
  }

  async findAllNoPaging(search?: string) {
    const queryBuilder = this.bannersRepo.createQueryBuilder('banner');
    
    if (search && search.trim()) {
      queryBuilder.where(
        'banner.position LIKE :search OR banner.url LIKE :search',
        { search: `%${search.trim()}%` }
      );
    }
    
    queryBuilder.orderBy('banner.id', 'ASC');
    
    return queryBuilder.getMany();
  }
}
