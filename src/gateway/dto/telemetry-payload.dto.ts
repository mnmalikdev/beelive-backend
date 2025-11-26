/**
 * Telemetry payload DTOs for WebSocket communication
 * Defines the structure of messages sent to clients
 */

/**
 * Delta telemetry payload
 * Contains only changed fields to minimize bandwidth
 */
export interface TelemetryDeltaPayload {
  type: 'telemetry';
  data: Partial<{
    temperature: number;
    humidity: number;
    weightKg: number;
    soundDb: number;
    co2Ppm: number;
    dailyHoneyGainG: number;
    swarmRisk: number;
    batteryPercent: number;
    recordedAt: Date;
  }>;
  full?: TelemetryFullPayload;
}

/**
 * Full telemetry payload
 * Complete telemetry object for initial connection
 */
export interface TelemetryFullPayload {
  id: string;
  hiveId: string;
  recordedAt: Date;
  temperature: number;
  humidity: number;
  weightKg: number;
  soundDb: number;
  co2Ppm: number;
  dailyHoneyGainG?: number;
  swarmRisk: number;
  batteryPercent: number;
}

