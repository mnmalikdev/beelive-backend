import { ApiProperty } from '@nestjs/swagger';

/**
 * Thresholds response DTO
 * Defines alert thresholds for beehive monitoring
 * Used by the user configuration panel to set alert boundaries
 */
export class ThresholdsResponseDto {
  @ApiProperty({
    example: 'BERLIN-ROOFTOP-01',
    description: 'Hive identifier',
  })
  hiveId: string;

  @ApiProperty({
    example: 30.0,
    description: 'Minimum acceptable temperature (°C)',
  })
  tempMin: number;

  @ApiProperty({
    example: 36.0,
    description: 'Maximum acceptable temperature (°C)',
  })
  tempMax: number;

  @ApiProperty({
    example: 30.0,
    description: 'Minimum acceptable humidity (%)',
  })
  humidityMin: number;

  @ApiProperty({
    example: 80.0,
    description: 'Maximum acceptable humidity (%)',
  })
  humidityMax: number;

  @ApiProperty({
    example: 0.5,
    description: 'Maximum acceptable weight drop per hour (kg) - alerts for possible robbery/swarming',
  })
  maxWeightDropPerHourKg: number;

  @ApiProperty({
    example: 25,
    description: 'Minimum acceptable sound level (dB)',
  })
  soundMin: number;

  @ApiProperty({
    example: 75,
    description: 'Maximum acceptable sound level (dB)',
  })
  soundMax: number;

  @ApiProperty({
    example: 1000,
    description: 'Maximum acceptable CO2 level (ppm)',
  })
  co2Max: number;

  @ApiProperty({
    example: -200,
    description: 'Minimum acceptable daily honey gain (g) - negative values indicate acceptable loss',
  })
  minDailyHoneyGainG: number;

  @ApiProperty({
    example: 70,
    description: 'Maximum acceptable swarm risk score (0-100)',
  })
  swarmRiskMax: number;

  @ApiProperty({
    example: 20.0,
    description: 'Minimum acceptable battery level (%)',
  })
  batteryMin: number;
}

