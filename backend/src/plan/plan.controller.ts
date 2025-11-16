import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { PlanService } from './plan.service';
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  rules?: any;
}

@Controller('plans')
export class PlanController {
  constructor(private readonly service: PlanService) {}

  @Post()
  async create(@Body() body: CreatePlanDto) {
    return this.service.create(body as any);
  }

  @Get()
  async list() {
    return this.service.findAll();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: Partial<CreatePlanDto>) {
    return this.service.update(id, body as any);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
