import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from './utils/logger';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';

async function bootstrap() {
  // dotenv.config(); // removed, ConfigModule handles env
  const app = await NestFactory.create(AppModule, { logger: false });
  const logger = new Logger();
  app.useLogger(logger);
  
  // Enable CORS for development; restrict in production as needed
  app.enableCors();
  // Global validation pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false }));

  // Ensure app and providers initialized
  await app.init();
  
  
  const port = process.env.PORT || 3001;

  // Wait for Nest to start
  await app.listen(port);

  logger.log(`Server started on http://localhost:${port}`);
}

bootstrap();
