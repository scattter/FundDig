import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async getHealth() {
    const status: any = { status: 'ok', db: { status: 'unknown' } };
    try {
      // Ensure DataSource initialized
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }
      // Lightweight query to verify connectivity
      await this.dataSource.query('SELECT 1');
      status.db.status = 'up';
    } catch (err: any) {
      status.status = 'fail';
      status.db.status = 'down';
      status.db.error = err?.message || String(err);
    }
    return status;
  }
}
