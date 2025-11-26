import { Module } from '@nestjs/common';
import { TelemetrySimulatorService } from './telemetry-simulator.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule,],
  providers: [TelemetrySimulatorService],
  exports: [TelemetrySimulatorService],
})
export class TelemetryModule {}

