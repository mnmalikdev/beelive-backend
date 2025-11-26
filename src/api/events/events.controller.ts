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
import { EventsService } from './events.service';
import { EventsQueryDto } from './dto/events-query.dto';
import { EventResponseDto } from './dto/event-response.dto';

/**
 * Events Controller
 * 
 * WHY: Provides RESTful API for alert logs and event history. Critical for
 * the dashboard alert panel where beekeepers review past alerts and incidents.
 * Supports filtering by event type for focused analysis.
 */
@ApiTags('Events')
@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get event logs (alert history)',
    description:
      'Returns alert log entries with optional filtering by type and pagination. ' +
      'Used by the dashboard to display alert history, allowing beekeepers to review ' +
      'past incidents and patterns. Supports efficient filtering for production workloads.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of events to return (1-1000, default: 50)',
    example: 50,
  })
  @ApiQuery({
    name: 'type',
    required: false,
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
    description: 'Filter by event type',
    example: 'TEMP_HIGH',
  })
  @ApiResponse({
    status: 200,
    description: 'Events retrieved successfully',
    type: [EventResponseDto],
  })
  async getEvents(@Query() query: EventsQueryDto) {
    try {
      return await this.eventsService.getEvents(query.limit, query.type);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve events',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

