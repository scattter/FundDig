import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fund } from './fund.entity';
import { FundService } from './fund.service';
import { FundController } from './fund.controller';
import { FundInfoController } from './fund.controller';
import { Plan } from '../plan/plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Fund, Plan])],
  controllers: [FundController, FundInfoController],
  providers: [FundService],
})
export class FundModule {}