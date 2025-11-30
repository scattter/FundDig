import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fund } from './fund.entity';
import { FundChange } from './fund-change.entity';
import { FundService } from './fund.service';
import { FundController } from './fund.controller';
import { FundInfoController } from './fund.controller';
import { Plan } from '../plan/plan.entity';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Fund, FundChange, Plan]), RedisModule],
  controllers: [FundController, FundInfoController],
  providers: [FundService],
})
export class FundModule {}
