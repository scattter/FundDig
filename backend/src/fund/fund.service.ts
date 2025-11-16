import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fund } from './fund.entity';
import { Plan } from '../plan/plan.entity';

@Injectable()
export class FundService {
  constructor(
    @InjectRepository(Fund) private readonly fundRepo: Repository<Fund>,
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
  ) {}

  async listByPlan(id: string) {
    const plan = await this.findPlan(id);
    return this.fundRepo.find({ where: { planId: plan.id }, order: { createdAt: 'DESC' } });
  }

  async createForPlan(id: string, data: Partial<Fund>) {
    const plan = await this.findPlan(id);
    const f = this.fundRepo.create({
      planId: plan.id,
      fundCode: String(data.fundCode || '').trim(),
      fundName: String((data as any).fundName || '').slice(0, 50),
      amount: String(data.amount ?? '0'),
      feeRate: String(data.feeRate ?? '0'),
    });
    return this.fundRepo.save(f);
  }

  async fetchFundInfo(code: string) {
    const c = String(code || '').trim();
    if (!/^[0-9]{6}$/.test(c)) {
      throw new BadRequestException('基金代码必须为6位数字');
    }
    const res = await fetch(`https://danjuanfunds.com/djapi/fund/${c}`);
    if (!res.ok) {
      throw new BadRequestException('获取基金信息失败');
    }
    const json = await res.json();
    const name = typeof json?.data?.fd_name === 'string' ? json.data.fd_name : '';
    return { name };
  }

  private async findPlan(id: string) {
    let plan = await this.planRepo.findOneBy({ id });
    if (!plan && id && id.length === 8) {
      plan = await this.planRepo.findOneBy({ shortId: id });
    }
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }
}