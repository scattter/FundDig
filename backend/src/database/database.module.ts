import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Module({
  // imports: [TypeOrmModule], // removed: not needed for InjectDataSource
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}