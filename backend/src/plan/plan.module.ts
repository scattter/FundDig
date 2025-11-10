import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './plan.entity';
import { PlanService } from './plan.service';
import { PlanController } from './plan.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Plan])],
  controllers: [PlanController],
  providers: [PlanService],
})
export class PlanModule {}
