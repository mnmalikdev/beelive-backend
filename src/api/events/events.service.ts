import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { eventLogs } from '../../database/schema';
import { eq, desc, and } from 'drizzle-orm';
import { HIVE_ID } from '../api.constants';
import { EventType } from './dto/events-query.dto';

/**
 * Events Service
 * Handles alert log/event operations
 * 
 * WHY: Event logs are critical for audit trails and alert history. This service
 * provides efficient querying with filtering by type and pagination. Essential
 * for production monitoring dashboards where beekeepers need to review alerts.
 */
@Injectable()
export class EventsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get events with optional filtering and pagination
   * Used by dashboard to display alert history
   * 
   * @param limit - Maximum number of events to return (default: 50)
   * @param type - Optional event type filter
   * @returns Array of event log entries
   */
  async getEvents(limit: number = 50, type?: EventType) {
    if (type) {
      return this.db.db
        .select()
        .from(eventLogs)
        .where(and(eq(eventLogs.hiveId, HIVE_ID), eq(eventLogs.type, type)))
        .orderBy(desc(eventLogs.createdAt))
        .limit(limit);
    }

    return this.db.db
      .select()
      .from(eventLogs)
      .where(eq(eventLogs.hiveId, HIVE_ID))
      .orderBy(desc(eventLogs.createdAt))
      .limit(limit);
  }
}

