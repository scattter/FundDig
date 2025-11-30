import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Backtest } from './backtest.entity';
import { BacktestFund } from './backtest-fund.entity';
import { BacktestService } from './backtest.service';
import { BacktestController } from './backtest.controller';
import { Plan } from '../plan/plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Backtest, BacktestFund, Plan])],
  controllers: [BacktestController],
  providers: [BacktestService],
})
export class BacktestModule {}
