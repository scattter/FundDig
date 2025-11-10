import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanModule } from './plan/plan.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

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

    // Database connection monitoring
    DatabaseModule,

    PlanModule,
    // health endpoint
    HealthModule,
  ],
})
export class AppModule {}
