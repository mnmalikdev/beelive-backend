import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '../database/database.service';
import { telemetry } from '../database/schema';
import { eq, desc } from 'drizzle-orm';
import { TELEMETRY_INTERVAL_MS } from './telemetry.constants';

@Injectable()
export class TelemetrySimulatorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetrySimulatorService.name);
  private intervalId: NodeJS.Timeout | null = null;
  private baseWeight = 25.5; // Starting weight in kg
  private readonly isDevelopment: boolean;

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
  }

  onModuleInit() {
    if (!this.isDevelopment) {
      this.logger.log('Telemetry simulator skipped (not in development mode)');
      return;
    }

    this.logger.log('Starting telemetry simulator (development mode)...');
    this.startSimulation();
  }

  onModuleDestroy() {
    this.stopSimulation();
  }

  private startSimulation() {
    // Generate first telemetry immediately
    this.generateAndStoreTelemetry();

    // Then generate every 3 minutes
    this.intervalId = setInterval(() => {
      this.generateAndStoreTelemetry();
    }, TELEMETRY_INTERVAL_MS);
  }

  private stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.log('Telemetry simulator stopped');
    }
  }

  private random(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private async generateAndStoreTelemetry() {
    try {
      const isDay = new Date().getHours() >= 6 && new Date().getHours() < 20;
      const hasSwarmRisk = Math.random() < 0.007;

      const recordedAt = new Date();
      const telemetryData = {
        hiveId: 'BERLIN-ROOFTOP-01',
        recordedAt,
        temperature: Number(this.random(18, 35).toFixed(1)),
        humidity: Number(this.random(45, 70).toFixed(1)),
        weightKg: Number((this.baseWeight += this.random(-0.02, 0.05)).toFixed(3)),
        soundDb: Math.round(isDay ? this.random(55, 72) : this.random(25, 40)),
        co2Ppm: Math.round(this.random(400, 700)),
        dailyHoneyGainG: Math.round(isDay ? this.random(300, 800) : this.random(-100, 100)),
        swarmRisk: Math.round(hasSwarmRisk ? this.random(80, 98) : this.random(5, 30)),
        batteryPercent: Number(this.random(88, 99.9).toFixed(1)),
      };

      await this.db.db.insert(telemetry).values(telemetryData);

      // Emit event for alert engine to process (include recordedAt for weight tracking)
      this.eventEmitter.emit('telemetry.inserted', telemetryData);
      
      // Fetch the latest inserted record to get the database-generated ID
      const [insertedRecord] = await this.db.db
        .select()
        .from(telemetry)
        .where(eq(telemetry.hiveId, telemetryData.hiveId))
        .orderBy(desc(telemetry.recordedAt))
        .limit(1);

      if (insertedRecord) {
        // Emit event for WebSocket gateway with complete data including ID
        this.eventEmitter.emit('telemetry.created', insertedRecord);
      }

      this.logger.debug(`Telemetry data stored: ${JSON.stringify(telemetryData)}`);
    } catch (error) {
      this.logger.error('Failed to store telemetry data', error);
    }
  }
}

