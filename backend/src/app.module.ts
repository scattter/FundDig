import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ResponseInterceptor } from './common/response.interceptor';
import { AllExceptionFilter } from './common/all-exception.filter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanModule } from './plan/plan.module';
import { FundModule } from './fund/fund.module';

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({ isGlobal: true }),

    // Configure TypeORM asynchronously using ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<number>('DB_PORT', 5432)),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASS', 'postgres'),
        database: config.get<string>('DB_NAME', 'funds'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // Only synchronize in non-production environments
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),

    PlanModule,
    FundModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionFilter },
  ],
})
export class AppModule {}
