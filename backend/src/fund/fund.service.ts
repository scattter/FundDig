import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fund } from './fund.entity';
import { Plan } from '../plan/plan.entity';
import { RedisService } from '../redis/redis.service';
import { FundChange } from './fund-change.entity';

@Injectable()
export class FundService {
  constructor(
    @InjectRepository(Fund) private readonly fundRepo: Repository<Fund>,
    @InjectRepository(FundChange) private readonly changeRepo: Repository<FundChange>,
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
    private readonly redis: RedisService,
  ) {}

  async listByPlan(id: string) {
    const plan = await this.findPlan(id);
    const funds = await this.fundRepo.find({ where: { planId: plan.id }, order: { createdAt: 'DESC' } });
    
    const fundsWithCount = await Promise.all(funds.map(async (fund) => {
      const count = await this.changeRepo.count({ where: { fundId: fund.id } });
      return { ...fund, changeCount: count };
    }));
    
    return fundsWithCount;
  }

  async createForPlan(id: string, data: Partial<Fund>) {
    const plan = await this.findPlan(id);
    const code = String(data.fundCode || '').trim();
    const dup = await this.fundRepo.findOne({ where: { planId: plan.id, fundCode: code } });
    if (dup) {
      throw new ConflictException('该计划已有相同基金');
    }
    let cached = await this.redis.getFundInfo(code);
    if (!cached) {
      const info = await this.fetchFundInfo(code);
      cached = {
        code,
        name: info?.name ?? null,
        company: info?.company ?? null,
        type: info?.type ?? null,
        feeRate: typeof data.feeRate === 'number' ? Number(data.feeRate) : null,
        performance: info?.performance ?? null,
        strategy: info?.strategy ?? null,
        createdAt: new Date().toISOString(),
      };
      await this.redis.setFundInfo(cached);
    }

    const f = this.fundRepo.create({
      planId: plan.id,
      fundCode: code,
      fundName: String(((data as any).fundName ?? cached?.name ?? '')).slice(0, 50),
      amount: String(data.amount ?? '0'),
      feeRate: String(data.feeRate ?? '0'),
    });
    const saved = await this.fundRepo.save(f);

    const change = this.changeRepo.create({
      planId: plan.id,
      fundId: saved.id,
      oldAmount: null,
      newAmount: saved.amount,
      oldFeeRate: null,
      newFeeRate: saved.feeRate,
      opType: 'create',
      opAmount: saved.amount,
    });
    await this.changeRepo.save(change);

    return saved;
  }

  async removeForPlan(id: string, fundId: string) {
    const plan = await this.findPlan(id);
    const fund = await this.fundRepo.findOne({ where: { id: fundId, planId: plan.id } });
    if (!fund) throw new NotFoundException('Fund not found');
    const res = await this.fundRepo.delete({ id: fund.id });
    return !!res.affected;
  }

  async updateForPlan(id: string, fundId: string, data: Partial<Fund> & { opType?: 'add' | 'reduce'; opAmount?: number }) {
    const plan = await this.findPlan(id);
    const fund = await this.fundRepo.findOne({ where: { id: fundId, planId: plan.id } });
    if (!fund) throw new NotFoundException('Fund not found');

    const oldAmount = fund.amount ?? null;
    const oldFeeRate = fund.feeRate ?? null;

    let opType = 'update';
    let opAmount = 0;

    if (data.opType && typeof data.opAmount === 'number') {
      const current = Number(fund.amount || '0');
      const delta = data.opAmount;
      opType = data.opType;
      opAmount = delta;

      if (data.opType === 'add') {
        fund.amount = String(current + delta);
      } else if (data.opType === 'reduce') {
        if (delta > current) {
          throw new BadRequestException('减仓金额不能超过持有金额');
        }
        fund.amount = String(current - delta);
      }
    } else if (typeof data.amount === 'number') {
      opType = 'update';
      opAmount = Math.abs(data.amount - Number(oldAmount || '0'));
      fund.amount = String(data.amount);
    }
    
    // Only update feeRate if it's NOT an add/reduce operation (i.e. direct edit)
    // or if opType is not present.
    if (!data.opType && typeof data.feeRate === 'number') {
      fund.feeRate = String(data.feeRate);
    }

    const saved = await this.fundRepo.save(fund);

    const change = this.changeRepo.create({
      planId: plan.id,
      fundId: fund.id,
      oldAmount,
      newAmount: saved.amount ?? null,
      oldFeeRate,
      newFeeRate: saved.feeRate ?? null,
      opType,
      opAmount: String(opAmount),
    });
    await this.changeRepo.save(change);
    return saved;
  }

  async fetchFundInfo(code: string) {
    const c = String(code || '').trim();
    if (!/^[0-9]{6}$/.test(c)) {
      throw new BadRequestException('基金代码必须为6位数字');
    }
    const res = await fetch(`${process.env.FUND_INFO_OPEN_API_HOST}/${c}`);
    if (!res.ok) {
      throw new BadRequestException('获取基金信息失败');
    }
    const json = await res.json();
    const data = json?.data ?? {};
    const name = typeof data?.fd_name === 'string' ? data.fd_name : '';
    const company = typeof data?.jjglr === 'string' ? data.jjglr : null;
    const type = typeof data?.jjlx === 'string' ? data.jjlx : null;
    const strategy = typeof data?.invest_strategy === 'string' ? data.invest_strategy : null;
    const performance = typeof data?.year_rates === 'object' && data.year_rates ? data.year_rates : null;
    return { name, company, type, strategy, performance };
  }

  async getCachedFundInfo(code: string) {
    const c = String(code || '').trim();
    if (!/^[0-9]{6}$/.test(c)) {
      throw new BadRequestException('基金代码必须为6位数字');
    }
    return this.redis.getFundInfo(c);
  }

  async getFundInfoPreferCache(code: string) {
    const c = String(code || '').trim();
    if (!/^[0-9]{6}$/.test(c)) {
      throw new BadRequestException('基金代码必须为6位数字');
    }
    const cached = await this.redis.getFundInfo(c);
    if (cached) {
      return {
        name: cached.name ?? '',
        company: cached.company ?? null,
        type: cached.type ?? null,
        strategy: cached.strategy ?? null,
        performance: cached.performance ?? null,
      };
    }
    const info = await this.fetchFundInfo(c);
    await this.redis.setFundInfo({
      code: c,
      name: info.name ?? null,
      company: info.company ?? null,
      type: info.type ?? null,
      feeRate: null,
      performance: info.performance ?? null,
      strategy: info.strategy ?? null,
      createdAt: new Date().toISOString(),
    });
    return info;
  }

  async getHistory(id: string, fundId: string) {
    const plan = await this.findPlan(id);
    // Ensure the fund belongs to the plan
    const fund = await this.fundRepo.findOne({ where: { id: fundId, planId: plan.id } });
    if (!fund) throw new NotFoundException('Fund not found');
    
    return this.changeRepo.find({
      where: { fundId: fund.id },
      order: { createdAt: 'DESC' },
    });
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
