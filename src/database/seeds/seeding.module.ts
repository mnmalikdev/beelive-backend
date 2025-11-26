import { Module } from '@nestjs/common';
import { SeedingService } from './seeding.service';
import { DatabaseModule } from '../database.module';

@Module({
  imports: [DatabaseModule],
  providers: [SeedingService],
  exports: [SeedingService],
})
export class SeedingModule {}

