import { Module } from '@nestjs/common';
import { TelemetryGateway } from './telemetry.gateway';

/**
 * Gateway Module
 * 
 * WHY: Encapsulates WebSocket gateway functionality.
 * Completely decoupled from business logic - only handles real-time communication.
 */
@Module({
  providers: [TelemetryGateway],
  exports: [TelemetryGateway],
})
export class GatewayModule {}

