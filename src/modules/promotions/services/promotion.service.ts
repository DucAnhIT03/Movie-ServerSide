
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PromotionRepository } from '../repositories/promotion.repository';
import { UserPromotionRepository } from '../repositories/user-promotion.repository';
import { CreatePromotionDto } from '../dtos/request/create-promotion.dto';
import { ApplyPromotionDto } from '../dtos/request/apply-promotion.dto';
import { DataSource } from 'typeorm';
import { Promotion } from '../../../shared/schemas/promotion.entity';
import { Users } from '../../../shared/schemas/users.entity';
import { UserPromotion } from '../../../shared/schemas/user-promotion.entity';

@Injectable()
export class PromotionService {
  constructor(
    private readonly repo: PromotionRepository,
    private readonly userPromoRepo: UserPromotionRepository,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreatePromotionDto) {
    try {
      const {
        startAt,
        endAt,
        usageLimit,
        perUserLimit,
        channelEmail,
        channelInApp,
        ...rest
      } = dto as Partial<CreatePromotionDto> & {
        startAt?: string;
        endAt?: string;
        usageLimit?: number;
        perUserLimit?: number;
      };
      const p = this.repo.create({
        ...rest,
        channelEmail: !!channelEmail,
        channelInApp: channelInApp !== false,
        active: true,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        usageLimit: usageLimit ?? null,
        perUserLimit: perUserLimit ?? null,
      } as Partial<Promotion>);
      return await this.repo.save(p);
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Promotion code already exists');
      }
      throw err;
    }
  }

  async findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const p = await this.repo.findOne({ where: { id } } as any);
    if (!p) throw new NotFoundException('Promotion not found');
    return p;
  }

  async update(id: number, dto: Partial<any>) {
    const p = await this.repo.findOne({ where: { id } } as any);
    if (!p) throw new NotFoundException('Promotion not found');

    if (dto.code !== undefined) p.code = dto.code;
    if (dto.title !== undefined) p.title = dto.title;
    if (dto.description !== undefined) p.description = dto.description;
    if (dto.discountType !== undefined) p.discountType = dto.discountType;
    if (dto.discountValue !== undefined) p.discountValue = dto.discountValue;
    if (dto.channelEmail !== undefined) p.channelEmail = !!dto.channelEmail;
    if (dto.channelInApp !== undefined) p.channelInApp = !!dto.channelInApp;
    if (dto.startAt !== undefined)
      p.startAt = dto.startAt ? new Date(dto.startAt) : undefined;
    if (dto.endAt !== undefined)
      p.endAt = dto.endAt ? new Date(dto.endAt) : undefined;
    if (dto.usageLimit !== undefined) p.usageLimit = dto.usageLimit;
    if (dto.perUserLimit !== undefined) p.perUserLimit = dto.perUserLimit;
    if (dto.active !== undefined) p.active = !!dto.active;

    return this.repo.save(p as any);
  }

  async sendPromotion(
    promoId: number,
    userId: number,
    channel: 'email' | 'inapp' = 'inapp',
  ) {
    const p = await this.findOne(promoId);
    if (channel === 'email' && p.channelEmail) {
      console.log(
        `[PromotionService] send EMAIL to user=${userId} promo=${p.code}`,
      );
      return { success: true };
    }
    if (channel === 'inapp' && p.channelInApp) {
      console.log(
        `[PromotionService] send INAPP to user=${userId} promo=${p.code}`,
      );
      return { success: true };
    }
    throw new BadRequestException('Channel not supported for this promotion');
  }

  async applyCode(userId: number | undefined, code: string) {
    if (userId === undefined || userId === null)
      throw new BadRequestException('User not authenticated');
    if (!Number.isInteger(userId) || userId <= 0)
      throw new BadRequestException('Invalid user');
    const userExists = await this.dataSource
      .getRepository(Users)
      .exist({ where: { id: userId } });
    if (!userExists) throw new BadRequestException('User does not exist');
    const p = await this.repo.findOne({ where: { code } } as any);
    if (!p || !p.active)
      throw new NotFoundException('Promotion not found or inactive');
    const now = new Date();
    if (p.startAt && now < new Date(p.startAt))
      throw new BadRequestException('Promotion not started');
    if (p.endAt && now > new Date(p.endAt))
      throw new BadRequestException('Promotion expired');
    if (p.usageLimit != null && Number(p.usageLimit) <= 0)
      throw new BadRequestException('Promotion usage exhausted');
    const up = await this.userPromoRepo.findOne({
      where: { userId, promotionId: p.id },
    } as any);
    const userUsed = up ? up.usedCount || 0 : 0;
    if (p.perUserLimit != null && userUsed >= Number(p.perUserLimit))
      throw new BadRequestException(
        'User reached usage limit for this promotion',
      );

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      if (p.usageLimit != null) {
        await qr.manager.decrement(Promotion, { id: p.id } as any, 'usageLimit', 1);
      }

      if (up) {
        await qr.manager.increment(
          UserPromotion,
          { userId: Number(userId), promotionId: p.id } as any,
          'usedCount',
          1,
        );
      } else {
        await qr.manager.insert(UserPromotion, {
          userId: Number(userId),
          promotionId: p.id,
          usedCount: 1,
        });
      }

      await qr.commitTransaction();
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    return {
      code: p.code,
      discountType: p.discountType,
      discountValue: p.discountValue,
    };
  }

  async remove(id: number) {
    const p = await this.repo.findOne({ where: { id } } as any);
    if (!p) throw new NotFoundException('Promotion not found');
    return this.repo.remove(p as any);
  }
}
