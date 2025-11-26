import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Event types that can trigger alerts
 */
export enum EventType {
  TEMP_HIGH = 'TEMP_HIGH',
  TEMP_LOW = 'TEMP_LOW',
  HUMIDITY_HIGH = 'HUMIDITY_HIGH',
  HUMIDITY_LOW = 'HUMIDITY_LOW',
  WEIGHT_DROP = 'WEIGHT_DROP',
  SWARM_RISK = 'SWARM_RISK',
  CO2_HIGH = 'CO2_HIGH',
  BATTERY_LOW = 'BATTERY_LOW',
  SOUND_ANOMALY = 'SOUND_ANOMALY',
}

/**
 * Query parameters for events endpoint
 * Used for filtering and paginating alert logs
 */
export class EventsQueryDto {
  @ApiProperty({
    example: 50,
    description: 'Maximum number of events to return (default: 50)',
    required: false,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;

  @ApiProperty({
    example: 'TEMP_HIGH',
    description: 'Filter by event type',
    enum: EventType,
    required: false,
  })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;
}

