import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

/**
 * Update thresholds DTO
 * Allows partial updates to threshold values
 * Used by the user configuration panel
 */
export class UpdateThresholdsDto {
  @ApiProperty({
    example: 30.0,
    description: 'Minimum acceptable temperature (°C)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(50)
  tempMin?: number;

  @ApiProperty({
    example: 36.0,
    description: 'Maximum acceptable temperature (°C)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(-10)
  @Max(50)
  tempMax?: number;

  @ApiProperty({
    example: 30.0,
    description: 'Minimum acceptable humidity (%)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  humidityMin?: number;

  @ApiProperty({
    example: 80.0,
    description: 'Maximum acceptable humidity (%)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  humidityMax?: number;

  @ApiProperty({
    example: 0.5,
    description: 'Maximum acceptable weight drop per hour (kg)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxWeightDropPerHourKg?: number;

  @ApiProperty({
    example: 25,
    description: 'Minimum acceptable sound level (dB)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  soundMin?: number;

  @ApiProperty({
    example: 75,
    description: 'Maximum acceptable sound level (dB)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(120)
  soundMax?: number;

  @ApiProperty({
    example: 1000,
    description: 'Maximum acceptable CO2 level (ppm)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  co2Max?: number;

  @ApiProperty({
    example: -200,
    description: 'Minimum acceptable daily honey gain (g)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  minDailyHoneyGainG?: number;

  @ApiProperty({
    example: 70,
    description: 'Maximum acceptable swarm risk score (0-100)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  swarmRiskMax?: number;

  @ApiProperty({
    example: 20.0,
    description: 'Minimum acceptable battery level (%)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  batteryMin?: number;
}

