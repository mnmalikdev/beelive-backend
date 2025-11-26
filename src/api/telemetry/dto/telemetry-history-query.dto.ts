import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Query parameters for telemetry history endpoint
 * Used for charting and historical data visualization
 */
export class TelemetryHistoryQueryDto {
  @ApiProperty({
    example: 24,
    description: 'Number of hours to look back (default: 24)',
    required: false,
    minimum: 1,
    maximum: 168,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  hours?: number;

  @ApiProperty({
    example: 1000,
    description: 'Maximum number of records to return (default: 1000)',
    required: false,
    minimum: 1,
    maximum: 10000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  limit?: number;
}

