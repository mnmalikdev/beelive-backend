import { Module } from '@nestjs/common';
import { AlertEngineService } from './alert-engine.service';
import { DatabaseModule } from '../database/database.module';

/**
 * Alerts Module
 * 
 * WHY: Encapsulates alert engine functionality in a dedicated module.
 * Follows NestJS best practices for module organization and separation of concerns.
 */
@Module({
  imports: [DatabaseModule],
  providers: [AlertEngineService],
  exports: [AlertEngineService],
})
export class AlertsModule {}

