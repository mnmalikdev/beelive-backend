import { ApiProperty } from '@nestjs/swagger';

/**
 * Event response DTO
 * Represents an alert/event log entry
 * Used for displaying the alert history in the dashboard
 */
export class EventResponseDto {
  @ApiProperty({
    example: '1',
    description: 'Unique identifier for the event (serialized as string)',
  })
  id: string;

  @ApiProperty({
    example: 'BERLIN-ROOFTOP-01',
    description: 'Hive identifier',
  })
  hiveId: string;

  @ApiProperty({
    example: '2025-11-27T11:42:18.123Z',
    description: 'Timestamp when the event occurred',
  })
  createdAt: Date;

  @ApiProperty({
    example: 'TEMP_HIGH',
    description: 'Type of event/alert',
    enum: [
      'TEMP_HIGH',
      'TEMP_LOW',
      'HUMIDITY_HIGH',
      'HUMIDITY_LOW',
      'WEIGHT_DROP',
      'SWARM_RISK',
      'CO2_HIGH',
      'BATTERY_LOW',
      'SOUND_ANOMALY',
    ],
  })
  type: string;

  @ApiProperty({
    example: 'Hive temperature critical: 38.7°C (threshold 36.0°C)',
    description: 'Human-readable event message',
  })
  message: string;
}

