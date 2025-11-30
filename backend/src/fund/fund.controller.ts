import { Controller, Get, Post, Param, Body, Delete, Put } from '@nestjs/common';
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

class UpdateFundDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  feeRate?: number;

  @IsOptional()
  @IsString()
  opType?: 'add' | 'reduce';

  @IsOptional()
  @IsNumber()
  @Min(0)
  opAmount?: number;
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

  @Delete(':id/funds/:fundId')
  async remove(@Param('id') id: string, @Param('fundId') fundId: string) {
    return this.service.removeForPlan(id, fundId);
  }

  @Put(':id/funds/:fundId')
  async update(
    @Param('id') id: string,
    @Param('fundId') fundId: string,
    @Body() body: UpdateFundDto,
  ) {
    return this.service.updateForPlan(id, fundId, body as any);
  }

  @Get(':id/funds/:fundId/history')
  async history(@Param('id') id: string, @Param('fundId') fundId: string) {
    return this.service.getHistory(id, fundId);
  }
}

@Controller('funds')
export class FundInfoController {
  constructor(private readonly service: FundService) {}

  @Get(':code/info')
  async info(@Param('code') code: string) {
    return this.service.getFundInfoPreferCache(code);
  }

  @Get(':code/cache')
  async cache(@Param('code') code: string) {
    return this.service.getCachedFundInfo(code);
  }
}
