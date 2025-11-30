import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: RedisService,
      useFactory: (config: ConfigService) => {
        const pass = config.get<string>('REDIS_PASS', process.env.REDIS_PASS);
        const options: any = {
          host: config.get<string>('REDIS_HOST', process.env.REDIS_HOST),
          port: Number(config.get<number>('REDIS_PORT', 6379)),
          db: Number(config.get<number>('REDIS_DB', 0)),
        };
        if (pass && pass.trim().length > 0) {
          options.password = pass;
        }
        return new RedisService(options);
      },
      inject: [ConfigService],
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}

