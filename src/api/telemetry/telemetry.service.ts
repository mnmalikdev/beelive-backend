import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { telemetry } from '../../database/schema';
import { eq, desc, gte, and } from 'drizzle-orm';
import { HIVE_ID } from '../api.constants';

/**
 * Telemetry Service
 * Handles all telemetry data operations for beehive monitoring
 * 
 * WHY: Real-time sensor data is the core of BeeLive. This service provides
 * efficient access to current readings (for dashboard gauges) and historical
 * data (for trend analysis and charts). Optimized for production workloads.
 */
@Injectable()
export class TelemetryService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get the latest telemetry reading
   * Used by dashboard to display current hive status (8 live gauges)
   * 
   * @returns Latest telemetry record
   * @throws NotFoundException if no data exists
   */
  async getLatest() {
    const [result] = await this.db.db
      .select()
      .from(telemetry)
      .where(eq(telemetry.hiveId, HIVE_ID))
      .orderBy(desc(telemetry.recordedAt))
      .limit(1);

    if (!result) {
      throw new NotFoundException('No telemetry data found for hive');
    }

    return result;
  }

  /**
   * Get historical telemetry data
   * Used for charting and trend analysis
   * 
   * @param hours - Number of hours to look back (default: 24)
   * @param limit - Maximum records to return (default: 1000)
   * @returns Array of telemetry records
   */
  async getHistory(hours: number = 24, limit: number = 1000) {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const results = await this.db.db
      .select()
      .from(telemetry)
      .where(
        and(
          eq(telemetry.hiveId, HIVE_ID),
          gte(telemetry.recordedAt, startDate),
        ),
      )
      .orderBy(desc(telemetry.recordedAt))
      .limit(limit);

    return results;
  }
}

