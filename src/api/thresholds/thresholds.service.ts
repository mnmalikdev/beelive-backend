import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { thresholds } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { HIVE_ID } from '../api.constants';

/**
 * Default threshold values
 * Based on beekeeping best practices and production monitoring requirements
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
 * Thresholds Service
 * Manages alert thresholds for beehive monitoring
 * 
 * WHY: Thresholds define when alerts are triggered. This service ensures
 * default values are always available (auto-created on first access) and
 * provides a clean API for the user configuration panel. Critical for
 * production alerting systems.
 */
@Injectable()
export class ThresholdsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get current thresholds for a specific hive
   * Auto-creates default thresholds if they don't exist
   * 
   * @param hiveId - Hive identifier (defaults to HIVE_ID constant)
   * @returns Current threshold configuration
   */
  async getThresholds(hiveId: string = HIVE_ID) {
    const [existing] = await this.db.db
      .select()
      .from(thresholds)
      .where(eq(thresholds.hiveId, hiveId));

    if (existing) {
      return existing;
    }

    // Auto-create defaults on first access
    const defaultThresholds = { ...DEFAULT_THRESHOLDS, hiveId };
    await this.db.db.insert(thresholds).values(defaultThresholds);

    return defaultThresholds;
  }

  /**
   * Update thresholds for a specific hive
   * Used by user configuration panel
   * 
   * @param hiveId - Hive identifier (defaults to HIVE_ID constant)
   * @param updateData - Partial threshold values to update
   * @returns Updated threshold configuration
   */
  async updateThresholds(hiveId: string = HIVE_ID, updateData: Partial<typeof DEFAULT_THRESHOLDS>) {
    // Ensure thresholds exist before updating
    await this.getThresholds(hiveId);

    await this.db.db
      .update(thresholds)
      .set(updateData)
      .where(eq(thresholds.hiveId, hiveId));

    return this.getThresholds(hiveId);
  }
}

