import IORedis, { RedisOptions } from 'ioredis';
import { OnModuleInit } from '@nestjs/common';
import { Logger } from '../utils/logger';

type FundCache = {
  code: string;
  name?: string | null;
  company?: string | null;
  type?: string | null;
  feeRate?: number | null;
  performance?: Record<string, number> | null;
  strategy?: string | null;
  createdAt: string;
};

export class RedisService implements OnModuleInit {
  private readonly client: IORedis;
  private readonly logger = new Logger();
  private readonly opts: RedisOptions;

  constructor(opts: RedisOptions) {
    this.opts = opts;
    this.client = new IORedis(opts);
  }

  async onModuleInit() {
    try {
      const pong = await this.client.ping();
      this.logger.log(
        `Redis connected: ${pong} ${this.opts.host}:${this.opts.port} db=${this.opts.db ?? 0}`,
        'RedisService',
      );
    } catch (err: any) {
      this.logger.error(`Redis connect failed: ${err?.message || String(err)}`, undefined, 'RedisService');
    }
  }

  async getFundInfo(code: string): Promise<FundCache | null> {
    const raw = await this.client.get(this.key(code));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async setFundInfo(info: FundCache, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(info);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(this.key(info.code), payload, 'EX', ttlSeconds);
    } else {
      await this.client.set(this.key(info.code), payload);
    }
  }

  private key(code: string) {
    return `fund:info:${String(code).trim()}`;
  }
}
