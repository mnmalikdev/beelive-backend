import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { TelemetryApiModule } from './api/telemetry/telemetry.module';
import { ThresholdsApiModule } from './api/thresholds/thresholds.module';
import { EventsApiModule } from './api/events/events.module';
import { SeedingModule } from './database/seeds/seeding.module';
import { AlertsModule } from './alerts/alerts.module';
import { GatewayModule } from './gateway/gateway.module';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    SeedingModule,
    TelemetryModule,
    AlertsModule,
    GatewayModule,
    TelemetryApiModule,
    ThresholdsApiModule,
    EventsApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
