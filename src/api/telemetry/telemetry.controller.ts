import {
  Controller,
  Get,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { TelemetryService } from './telemetry.service';
import { TelemetryResponseDto } from './dto/telemetry-response.dto';
import { TelemetryHistoryQueryDto } from './dto/telemetry-history-query.dto';

/**
 * Telemetry Controller
 * 
 * WHY: Provides RESTful API for real-time beehive sensor data.
 * Critical for dashboard gauges (latest) and historical charts (history).
 * Production-ready with proper error handling and Swagger documentation.
 */
@ApiTags('Telemetry')
@Controller('api/telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  @Get('latest')
  @ApiOperation({
    summary: 'Get latest telemetry reading',
    description:
      'Returns the most recent sensor reading from the beehive. ' +
      'Used by dashboard to display 8 live gauges (temperature, humidity, weight, sound, CO2, honey gain, swarm risk, battery). ' +
      'Optimized for real-time monitoring with sub-second response times.',
  })
  @ApiResponse({
    status: 200,
    description: 'Latest telemetry data retrieved successfully',
    type: TelemetryResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No telemetry data found',
  })
  async getLatest() {
    try {
      return await this.telemetryService.getLatest();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to retrieve latest telemetry',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get historical telemetry data',
    description:
      'Returns telemetry records within the specified time range. ' +
      'Used for charting, trend analysis, and historical data visualization. ' +
      'Supports efficient pagination and time-based filtering for production workloads.',
  })
  @ApiQuery({
    name: 'hours',
    required: false,
    type: Number,
    description: 'Number of hours to look back (1-168, default: 24)',
    example: 24,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of records to return (1-10000, default: 1000)',
    example: 1000,
  })
  @ApiResponse({
    status: 200,
    description: 'Historical telemetry data retrieved successfully',
    type: [TelemetryResponseDto],
  })
  async getHistory(@Query() query: TelemetryHistoryQueryDto) {
    try {
      return await this.telemetryService.getHistory(query.hours, query.limit);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve telemetry history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

