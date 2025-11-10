import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './plan.entity';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(Plan)
    private readonly repo: Repository<Plan>,
  ) {}

  async create(data: Partial<Plan>) {
    const plan = this.repo.create(data);
    return this.repo.save(plan);
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const plan = await this.repo.findOneBy({ id });
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }
}
