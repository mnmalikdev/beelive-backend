import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ThresholdsService } from './thresholds.service';
import { ThresholdsResponseDto } from './dto/thresholds-response.dto';
import { UpdateThresholdsDto } from './dto/update-thresholds.dto';

/**
 * Thresholds Controller
 * 
 * WHY: Provides RESTful API for managing alert thresholds. Critical for
 * the user configuration panel where beekeepers can customize alert boundaries.
 * Auto-creates sensible defaults on first access (zero-configuration UX).
 */
@ApiTags('Thresholds')
@Controller('api/thresholds')
export class ThresholdsController {
  constructor(private readonly thresholdsService: ThresholdsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get current thresholds for a hive',
    description:
      'Returns the current alert threshold configuration for the specified hive. ' +
      'Auto-creates default thresholds based on beekeeping best practices if none exist. ' +
      'Used by the configuration panel to display current settings.',
  })
  @ApiQuery({
    name: 'hiveId',
    required: false,
    type: String,
    description: 'Hive identifier (defaults to BERLIN-ROOFTOP-01)',
    example: 'BERLIN-ROOFTOP-01',
  })
  @ApiResponse({
    status: 200,
    description: 'Thresholds retrieved successfully',
    type: ThresholdsResponseDto,
  })
  async getThresholds(@Query('hiveId') hiveId?: string) {
    try {
      return await this.thresholdsService.getThresholds(hiveId);
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve thresholds',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch()
  @ApiOperation({
    summary: 'Update thresholds for a hive',
    description:
      'Updates alert threshold values for the specified hive. Supports partial updates - only provided fields are updated. ' +
      'Used by the user configuration panel to customize alert boundaries. ' +
      'All values are validated to ensure they are within acceptable ranges.',
  })
  @ApiQuery({
    name: 'hiveId',
    required: false,
    type: String,
    description: 'Hive identifier (defaults to BERLIN-ROOFTOP-01)',
    example: 'BERLIN-ROOFTOP-01',
  })
  @ApiBody({
    type: UpdateThresholdsDto,
    description: 'Partial threshold values to update',
  })
  @ApiResponse({
    status: 200,
    description: 'Thresholds updated successfully',
    type: ThresholdsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid threshold values provided',
  })
  async updateThresholds(
    @Query('hiveId') hiveId: string | undefined,
    @Body() updateDto: UpdateThresholdsDto,
  ) {
    try {
      return await this.thresholdsService.updateThresholds(hiveId, updateDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update thresholds',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

