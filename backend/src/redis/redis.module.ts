import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: RedisService,
      useFactory: (config: ConfigService) => new RedisService({
        host: config.get<string>('REDIS_HOST', process.env.REDIS_HOST),
        port: Number(config.get<number>('REDIS_PORT', 6379)),
        password: config.get<string>('REDIS_PASS', process.env.REDIS_PASS),
        db: Number(config.get<number>('REDIS_DB', 0)),
      }),
      inject: [ConfigService],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}

