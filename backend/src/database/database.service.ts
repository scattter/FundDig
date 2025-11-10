import { Injectable, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Logger } from '../utils/logger';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger();

  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async onModuleInit() {
    // 数据库连接检查已由 TypeORM 自动处理，此处无需额外检查
  }
}
