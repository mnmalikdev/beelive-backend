import { ApiProperty } from '@nestjs/swagger';

/**
 * Telemetry response DTO
 * Represents a single sensor reading from the beehive monitoring system
 */
export class TelemetryResponseDto {
  @ApiProperty({
    example: '1',
    description: 'Unique identifier for the telemetry record (serialized as string)',
  })
  id: string;

  @ApiProperty({
    example: 'BERLIN-ROOFTOP-01',
    description: 'Hive identifier (multi-tenant ready)',
  })
  hiveId: string;

  @ApiProperty({
    example: '2025-11-27T11:42:18.123Z',
    description: 'Timestamp when the reading was recorded',
  })
  recordedAt: Date;

  @ApiProperty({
    example: 32.5,
    description: 'Hive temperature in Celsius (°C)',
  })
  temperature: number;

  @ApiProperty({
    example: 65.3,
    description: 'Relative humidity percentage (%)',
  })
  humidity: number;

  @ApiProperty({
    example: 25.847,
    description: 'Total hive weight in kilograms (kg)',
  })
  weightKg: number;

  @ApiProperty({
    example: 68,
    description: 'Sound level in decibels (dB) - indicates bee activity',
  })
  soundDb: number;

  @ApiProperty({
    example: 550,
    description: 'CO2 concentration in parts per million (ppm)',
  })
  co2Ppm: number;

  @ApiProperty({
    example: 450,
    description: 'Daily honey gain in grams (g) - can be negative',
    required: false,
  })
  dailyHoneyGainG?: number;

  @ApiProperty({
    example: 25,
    description: 'Swarm risk score (0-100) - higher indicates higher risk',
  })
  swarmRisk: number;

  @ApiProperty({
    example: 95.5,
    description: 'Battery level percentage (%)',
  })
  batteryPercent: number;
}

