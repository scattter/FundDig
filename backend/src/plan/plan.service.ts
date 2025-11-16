import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './plan.entity';
import { Fund } from '../fund/fund.entity';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private readonly repo: Repository<Plan>,
  ) {}

  async create(data: Partial<Plan>) {
    const plan = this.repo.create(data);
    plan.shortId = await this.generateUniqueShortId();
    return this.repo.save(plan);
  }

  async findAll() {
    const qb = this.repo.createQueryBuilder('plan')
      .addSelect((sub) => sub.select('COUNT(*)').from(Fund, 'fund').where('fund.planId = plan.id'), 'fundCount')
      .orderBy('plan.createdAt', 'DESC');
    const rows = await qb.getRawAndEntities();
    return rows.entities.map((plan, i) => ({ ...plan, fundCount: Number(rows.raw[i].fundCount) }));
  }

  async findOne(id: string) {
    if (id && id.length === 8) {
      const byShort = await this.repo.findOneBy({ shortId: id });
      if (byShort) return byShort;
    }
    const byId = await this.repo.findOneBy({ id });
    if (!byId) throw new NotFoundException('Plan not found');
    return byId;
  }

  async update(id: string, data: Partial<Plan>) {
    const plan = await this.findOne(id);
    if (typeof data.name === 'string') plan.name = data.name.trim();
    if (typeof data.description === 'string') plan.description = data.description;
    return this.repo.save(plan);
  }

  async remove(id: string) {
    const plan = await this.findOne(id);
    const res = await this.repo.delete({ id: plan.id });
    return !!res.affected;
  }

  private async generateUniqueShortId(): Promise<string> {
    while (true) {
      const id = String(Math.floor(10000000 + Math.random() * 90000000));
      const exists = await this.repo.findOneBy({ shortId: id });
      if (!exists) return id;
    }
  }
}
