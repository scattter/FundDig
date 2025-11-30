import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { BacktestService } from './backtest.service';

@Controller('plans/:id/backtests')
export class BacktestController {
  constructor(private readonly service: BacktestService) {}

  @Post()
  async create(@Param('id') planId: string, @Body() body: any) {
    return this.service.create(planId, body);
  }

  @Put(':btId')
  async update(@Param('btId') btId: string, @Body() body: any) {
    return this.service.update(btId, body);
  }

  @Delete(':btId')
  async delete(@Param('btId') btId: string) {
    return this.service.delete(btId);
  }

  @Get()
  async list(@Param('id') planId: string) {
    return this.service.listByPlan(planId);
  }
}
