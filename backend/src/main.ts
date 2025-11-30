import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from './utils/logger';
import * as dotenv from 'dotenv';
dotenv.config();
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';

async function bootstrap() {
  let app: any;
  const logger = new Logger();
  try {
    app = await NestFactory.create(AppModule, { logger: false });
  } catch (e: any) {
    logger.error(`NestFactory.create failed: ${e?.message || String(e)}`);
    console.error(e);
    throw e;
  }
  app.useLogger(logger);
  
  // Enable CORS for development; restrict in production as needed
  app.enableCors();
  // Global validation pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }));

  try {
    await app.init();
  } catch (e: any) {
    logger.error(`app.init failed: ${e?.message || String(e)}`);
    console.error(e);
    throw e;
  }
  
  const port = process.env.PORT || 3001;
  logger.log(`Starting server on http://localhost:${port}`);
  try {
    await app.listen(port);
  } catch (e: any) {
    logger.error(`app.listen failed: ${e?.message || String(e)}`);
    console.error(e);
    throw e;
  }
  logger.log(`Server started on http://localhost:${port}`);

  // 检查数据库连接（不阻塞服务启动）
  try {
    const dataSource = app.get(DataSource);
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    await dataSource.query('SELECT 1');
    logger.log('数据库连接已成功');
  } catch (err: any) {
    logger.error(`数据库连接失败: ${err?.message || String(err)}`);
  }
}

bootstrap().catch((err) => {
  const logger = new Logger();
  logger.error(`Bootstrap failed: ${err?.message || String(err)}`);
  process.exit(1);
});
