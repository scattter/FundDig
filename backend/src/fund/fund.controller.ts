import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { FundService } from './fund.service';
import { IsString, IsNumber, Min, IsOptional, MaxLength } from 'class-validator';

class CreateFundDto {
  @IsString()
  fundCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  fundName?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  feeRate?: number;
}

@Controller('plans')
export class FundController {
  constructor(private readonly service: FundService) {}

  @Get(':id/funds')
  async list(@Param('id') id: string) {
    return this.service.listByPlan(id);
  }

  @Post(':id/funds')
  async create(@Param('id') id: string, @Body() body: CreateFundDto) {
    return this.service.createForPlan(id, body as any);
  }
}

@Controller('funds')
export class FundInfoController {
  constructor(private readonly service: FundService) {}

  @Get(':code/info')
  async info(@Param('code') code: string) {
    return this.service.fetchFundInfo(code);
  }
}