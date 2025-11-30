import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Backtest } from './backtest.entity';
import { Plan } from '../plan/plan.entity';

@Injectable()
export class BacktestService {
  constructor(
    @InjectRepository(Backtest) private readonly backtestRepo: Repository<Backtest>,
    @InjectRepository(Plan) private readonly planRepo: Repository<Plan>,
  ) {}

  async create(planId: string, data: { name: string; totalAmount: number; funds: { fundCode: string; fundName: string; percentage: number; amount: number }[] }) {
    const plan = await this.planRepo.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    const backtest = this.backtestRepo.create({
      planId: plan.id,
      name: data.name,
      totalAmount: data.totalAmount,
      funds: data.funds.map(f => ({
        fundCode: f.fundCode,
        fundName: f.fundName,
        percentage: f.percentage,
        amount: f.amount,
      })),
    });

    const saved = await this.backtestRepo.save(backtest);
    return this.backtestRepo.findOne({ where: { id: saved.id }, relations: ['funds'] });
  }

  async update(id: string, data: { name: string; totalAmount: number; funds: { fundCode: string; fundName: string; percentage: number; amount: number }[] }) {
    const backtest = await this.backtestRepo.findOne({ where: { id }, relations: ['funds'] });
    if (!backtest) throw new NotFoundException('Backtest not found');

    backtest.name = data.name;
    backtest.totalAmount = data.totalAmount;
    
    // Update funds: remove old ones and create new ones
    // Since we have cascade: true in entity, we can just replace the array
    // But we need to be careful. TypeORM might try to update existing ones if IDs match.
    // Here we want to replace completely.
    
    // First delete existing funds
    // We can't just set backtest.funds = newFunds because of how TypeORM handles OneToMany updates sometimes.
    // Safe way: delete existing explicitly if needed, or rely on orphanRemoval if configured (we didn't check orphanRemoval).
    // Let's check entity definition again.
    // Entity says: @OneToMany(() => BacktestFund, (fund) => fund.backtest, { cascade: true })
    // It doesn't say orphanRemoval: true. So simply replacing the array might leave orphaned records or fail.
    // Let's try to clear them first.
    
    // Actually, to be safe and simple:
    // 1. Remove all funds associated with this backtestId manually via QueryBuilder or Repository.
    // 2. Save the backtest with new funds.
    
    await this.backtestRepo.manager.delete('backtest_fund', { backtestId: id });
    
    backtest.funds = data.funds.map(f => ({
      fundCode: f.fundCode,
      fundName: f.fundName,
      percentage: f.percentage,
      amount: f.amount,
    })) as any; // Type cast to avoid partial type issues if any

    const saved = await this.backtestRepo.save(backtest);
    return this.backtestRepo.findOne({ where: { id: saved.id }, relations: ['funds'] });
  }

  async delete(id: string) {
    const result = await this.backtestRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Backtest not found');
    }
    return { code: 200, result: true };
  }

  async listByPlan(planId: string) {
    return this.backtestRepo.find({
      where: { planId },
      relations: ['funds'],
      order: { createdAt: 'DESC' },
    });
  }
}
