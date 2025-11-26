import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database.service';
import { thresholds, telemetry, eventLogs } from '../schema';
import { eq } from 'drizzle-orm';
import { HIVE_ID } from '../../api/api.constants';

/**
 * Default threshold values for seeding
 * Based on beekeeping best practices
 */
const DEFAULT_THRESHOLDS = {
  hiveId: HIVE_ID,
  tempMin: 30.0,
  tempMax: 36.0,
  humidityMin: 30.0,
  humidityMax: 80.0,
  maxWeightDropPerHourKg: 0.5,
  soundMin: 25,
  soundMax: 75,
  co2Max: 1000,
  minDailyHoneyGainG: -200,
  swarmRiskMax: 70,
  batteryMin: 20.0,
};

/**
 * Seeding Service
 * 
 * WHY: Provides lightweight database seeding for development and demo purposes.
 * Ensures default thresholds exist and can optionally seed sample data.
 * Production-ready with environment-aware execution.
 */
@Injectable()
export class SeedingService implements OnModuleInit {
  private readonly logger = new Logger(SeedingService.name);
  private readonly isDevelopment: boolean;

  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    this.isDevelopment = this.configService.get<string>('NODE_ENV') === 'development';
  }

  async onModuleInit() {
    if (!this.isDevelopment) {
      this.logger.log('Seeding skipped (not in development mode)');
      return;
    }

    this.logger.log('🌱 Database seeding started (development mode)');
    try {
      await this.seed();
      this.logger.log('✅ Database seeding completed successfully');
    } catch (error) {
      this.logger.warn('⚠️ Database seeding encountered issues (this is OK if tables don\'t exist yet)');
    }
  }

  /**
   * Main seeding method
   * Seeds default thresholds if they don't exist
   */
  async seed() {
    await this.seedThresholds();
  }

  /**
   * Seed default thresholds
   * Only creates if they don't already exist
   * Gracefully handles missing tables (migrations not run yet)
   */
  async seedThresholds() {
    try {
      const [existing] = await this.db.db
        .select()
        .from(thresholds)
        .where(eq(thresholds.hiveId, HIVE_ID));

      if (existing) {
        this.logger.debug('Thresholds already exist, skipping seed');
        return;
      }

      await this.db.db.insert(thresholds).values(DEFAULT_THRESHOLDS);
      this.logger.log(`Seeded default thresholds for hive: ${HIVE_ID}`);
    } catch (error: any) {
      // Handle case where table doesn't exist yet (migrations not run)
      if (error?.code === 'ER_NO_SUCH_TABLE' || error?.cause?.code === 'ER_NO_SUCH_TABLE') {
        this.logger.warn(
          'Thresholds table does not exist. Please run migrations first: npm run db:push or npm run db:generate',
        );
        return;
      }
      this.logger.error('Failed to seed thresholds', error);
      // Don't throw - allow app to continue even if seeding fails
    }
  }

  /**
   * Seed sample telemetry data (optional)
   * Useful for demo/testing purposes
   * 
   * @param count - Number of sample records to create
   */
  async seedSampleTelemetry(count: number = 10) {
    try {
      const baseWeight = 25.5;
      const now = new Date();
      const sampleData: Array<{
        hiveId: string;
        recordedAt: Date;
        temperature: number;
        humidity: number;
        weightKg: number;
        soundDb: number;
        co2Ppm: number;
        dailyHoneyGainG: number;
        swarmRisk: number;
        batteryPercent: number;
      }> = [];

      for (let i = 0; i < count; i++) {
        const recordedAt = new Date(now.getTime() - (count - i) * 3 * 60 * 1000); // 3 minutes apart
        const isDay = recordedAt.getHours() >= 6 && recordedAt.getHours() < 20;

        sampleData.push({
          hiveId: HIVE_ID,
          recordedAt,
          temperature: Number((Math.random() * (35 - 18) + 18).toFixed(1)),
          humidity: Number((Math.random() * (70 - 45) + 45).toFixed(1)),
          weightKg: Number((baseWeight + Math.random() * 2).toFixed(3)),
          soundDb: Math.round(isDay ? Math.random() * (72 - 55) + 55 : Math.random() * (40 - 25) + 25),
          co2Ppm: Math.round(Math.random() * (700 - 400) + 400),
          dailyHoneyGainG: Math.round(isDay ? Math.random() * (800 - 300) + 300 : Math.random() * (100 - -100) - 100),
          swarmRisk: Math.round(Math.random() * (30 - 5) + 5),
          batteryPercent: Number((Math.random() * (99.9 - 88) + 88).toFixed(1)),
        });
      }

      await this.db.db.insert(telemetry).values(sampleData);
      this.logger.log(`Seeded ${count} sample telemetry records`);
    } catch (error) {
      this.logger.error('Failed to seed sample telemetry', error);
      throw error;
    }
  }

  /**
   * Seed sample event logs (optional)
   * Useful for demo/testing purposes
   * 
   * @param count - Number of sample records to create
   */
  async seedSampleEvents(count: number = 5) {
    try {
      const eventTypes = [
        'TEMP_HIGH',
        'SWARM_RISK',
        'WEIGHT_DROP',
        'BATTERY_LOW',
        'HUMIDITY_HIGH',
      ];

      const messages = [
        'Hive temperature critical: 38.7°C (threshold 36.0°C)',
        'Swarm risk very high: 92/100 – immediate inspection recommended',
        'Sudden weight loss detected: -0.72 kg in last hour (possible robbery or swarming)',
        'Battery level low: 18% – please recharge device',
        'Humidity above threshold: 85% (threshold 80%)',
      ];

      const now = new Date();
      const sampleData: Array<{
        hiveId: string;
        createdAt: Date;
        type: string;
        message: string;
      }> = [];

      for (let i = 0; i < count; i++) {
        const typeIndex = i % eventTypes.length;
        sampleData.push({
          hiveId: HIVE_ID,
          createdAt: new Date(now.getTime() - (count - i) * 60 * 60 * 1000), // 1 hour apart
          type: eventTypes[typeIndex],
          message: messages[typeIndex],
        });
      }

      await this.db.db.insert(eventLogs).values(sampleData);
      this.logger.log(`Seeded ${count} sample event logs`);
    } catch (error) {
      this.logger.error('Failed to seed sample events', error);
      throw error;
    }
  }
}

