import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { DatabaseService } from '../database/database.service';
import { eventLogs, thresholds } from '../database/schema';
import { eq } from 'drizzle-orm';
import { HIVE_ID } from '../api/api.constants';
import { ALERT_DEBOUNCE_MS, ALERT_HYSTERESIS_PERCENT } from './alerts.constants';

/**
 * Alert types matching the 8 sensors in BeeLive
 * Each sensor can trigger alerts based on threshold violations
 */
export enum AlertType {
  TEMP_HIGH = 'TEMP_HIGH',
  TEMP_LOW = 'TEMP_LOW',
  HUMIDITY_HIGH = 'HUMIDITY_HIGH',
  HUMIDITY_LOW = 'HUMIDITY_LOW',
  WEIGHT_DROP = 'WEIGHT_DROP',
  SOUND_ANOMALY = 'SOUND_ANOMALY',
  CO2_HIGH = 'CO2_HIGH',
  SWARM_RISK = 'SWARM_RISK',
  BATTERY_LOW = 'BATTERY_LOW',
  HONEY_GAIN_LOW = 'HONEY_GAIN_LOW',
}

/**
 * Alert state tracking for in-memory state management
 * Tracks whether alert is active, last trigger/clear times, and debounce timers
 */
interface AlertState {
  isActive: boolean;
  lastTriggeredAt: Date | null;
  lastClearedAt: Date | null;
  debounceTimer: NodeJS.Timeout | null;
  lastValue: number | null;
}

/**
 * Alert Engine Service
 * 
 * WHY: Production-grade alerting system with hysteresis and debouncing.
 * Prevents alert spam by only triggering on state changes (enter/exit).
 * Completely independent of WebSockets - emits events that any service can listen to.
 * 
 * Architecture:
 * - Listens to telemetry inserts via EventEmitter2 (@OnEvent decorator)
 * - Tracks alert state in-memory per alert type (prevents duplicate alerts)
 * - 5-minute debounce prevents rapid toggling (production requirement)
 * - Hysteresis prevents oscillation (different thresholds for enter/exit)
 * - Only writes to event_logs on state transitions (enter/exit)
 * - Emits 'alert.triggered' and 'alert.cleared' events for other services
 * 
 * Best Practices:
 * - Single Responsibility: Only handles alert logic, no WebSocket code
 * - Separation of Concerns: Event-driven architecture
 * - Production-ready: Error handling, logging, state management
 */
@Injectable()
export class AlertEngineService implements OnModuleInit {
  private readonly logger = new Logger(AlertEngineService.name);
  private readonly DEBOUNCE_MS = ALERT_DEBOUNCE_MS;
  private readonly HYSTERESIS_PERCENT = ALERT_HYSTERESIS_PERCENT;

  // In-memory state tracking per alert type
  private readonly alertStates: Map<AlertType, AlertState> = new Map();
  private thresholds: any = null;
  private lastWeight: number | null = null;
  private lastWeightTime: Date | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Initialize alert states for all alert types
    Object.values(AlertType).forEach((type) => {
      this.alertStates.set(type, {
        isActive: false,
        lastTriggeredAt: null,
        lastClearedAt: null,
        debounceTimer: null,
        lastValue: null,
      });
    });
  }

  /**
   * Initialize service on module startup
   * Loads thresholds from database
   */
  async onModuleInit() {
    await this.loadThresholds();
    this.logger.log('🚨 Alert engine initialized');
  }

  /**
   * Load thresholds from database
   * Called on init and can be called to refresh thresholds
   */
  private async loadThresholds() {
    try {
      const [result] = await this.db.db
        .select()
        .from(thresholds)
        .where(eq(thresholds.hiveId, HIVE_ID));

      if (result) {
        this.thresholds = result;
        this.logger.debug('Thresholds loaded successfully');
      } else {
        this.logger.warn('No thresholds found, alerts will not trigger');
      }
    } catch (error) {
      this.logger.error('Failed to load thresholds', error);
    }
  }

  /**
   * Listen to telemetry insert events
   * Triggered whenever new telemetry is inserted into the database
   * 
   * @param telemetryData - The telemetry record that was inserted
   */
  @OnEvent('telemetry.inserted')
  async handleTelemetryInsert(telemetryData: any) {
    if (!this.thresholds) {
      await this.loadThresholds();
      if (!this.thresholds) {
        this.logger.warn('Cannot process alerts: thresholds not available');
        return;
      }
    }

    // Process all 8 sensor alerts
    await Promise.all([
      this.checkTemperatureAlerts(telemetryData),
      this.checkHumidityAlerts(telemetryData),
      this.checkWeightAlerts(telemetryData),
      this.checkSoundAlerts(telemetryData),
      this.checkCo2Alerts(telemetryData),
      this.checkSwarmRiskAlerts(telemetryData),
      this.checkBatteryAlerts(telemetryData),
      this.checkHoneyGainAlerts(telemetryData),
    ]);
  }

  /**
   * Check temperature alerts with hysteresis
   * Monitors both high and low temperature thresholds
   * 
   * @param data - Telemetry data containing temperature
   */
  private async checkTemperatureAlerts(data: any) {
    const temp = data.temperature;
    const state = this.alertStates.get(AlertType.TEMP_HIGH)!;
    const stateLow = this.alertStates.get(AlertType.TEMP_LOW)!;

    // High temperature alert with hysteresis
    const highThreshold = this.thresholds.tempMax;
    const highClearThreshold = highThreshold * (1 - this.HYSTERESIS_PERCENT);

    if (temp > highThreshold && !state.isActive) {
      await this.triggerAlert(
        AlertType.TEMP_HIGH,
        `Hive temperature critical: ${temp}°C (threshold ${highThreshold}°C)`,
        temp,
      );
    } else if (temp < highClearThreshold && state.isActive) {
      await this.clearAlert(
        AlertType.TEMP_HIGH,
        `Temperature normalized: ${temp}°C`,
        temp,
      );
    }

    // Low temperature alert with hysteresis
    const lowThreshold = this.thresholds.tempMin;
    const lowClearThreshold = lowThreshold * (1 + this.HYSTERESIS_PERCENT);

    if (temp < lowThreshold && !stateLow.isActive) {
      await this.triggerAlert(
        AlertType.TEMP_LOW,
        `Hive temperature low: ${temp}°C (threshold ${lowThreshold}°C)`,
        temp,
      );
    } else if (temp > lowClearThreshold && stateLow.isActive) {
      await this.clearAlert(
        AlertType.TEMP_LOW,
        `Temperature normalized: ${temp}°C`,
        temp,
      );
    }
  }

  /**
   * Check humidity alerts with hysteresis
   * Monitors both high and low humidity thresholds
   * 
   * @param data - Telemetry data containing humidity
   */
  private async checkHumidityAlerts(data: any) {
    const humidity = data.humidity;
    const state = this.alertStates.get(AlertType.HUMIDITY_HIGH)!;
    const stateLow = this.alertStates.get(AlertType.HUMIDITY_LOW)!;

    // High humidity alert with hysteresis
    const highThreshold = this.thresholds.humidityMax;
    const highClearThreshold = highThreshold * (1 - this.HYSTERESIS_PERCENT);

    if (humidity > highThreshold && !state.isActive) {
      await this.triggerAlert(
        AlertType.HUMIDITY_HIGH,
        `Humidity above threshold: ${humidity}% (threshold ${highThreshold}%)`,
        humidity,
      );
    } else if (humidity < highClearThreshold && state.isActive) {
      await this.clearAlert(
        AlertType.HUMIDITY_HIGH,
        `Humidity normalized: ${humidity}%`,
        humidity,
      );
    }

    // Low humidity alert with hysteresis
    const lowThreshold = this.thresholds.humidityMin;
    const lowClearThreshold = lowThreshold * (1 + this.HYSTERESIS_PERCENT);

    if (humidity < lowThreshold && !stateLow.isActive) {
      await this.triggerAlert(
        AlertType.HUMIDITY_LOW,
        `Humidity below threshold: ${humidity}% (threshold ${lowThreshold}%)`,
        humidity,
      );
    } else if (humidity > lowClearThreshold && stateLow.isActive) {
      await this.clearAlert(
        AlertType.HUMIDITY_LOW,
        `Humidity normalized: ${humidity}%`,
        humidity,
      );
    }
  }

  /**
   * Check weight drop alerts
   * Compares current weight with previous reading to detect sudden drops
   * 
   * @param data - Telemetry data containing weight and timestamp
   */
  private async checkWeightAlerts(data: any) {
    const currentWeight = data.weightKg;
    const currentTime = data.recordedAt instanceof Date ? data.recordedAt : new Date(data.recordedAt);

    if (this.lastWeight !== null && this.lastWeightTime !== null) {
      const timeDiffMs = currentTime.getTime() - this.lastWeightTime.getTime();
      const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
      const weightDiff = this.lastWeight - currentWeight;

      // Only check if time difference is within 1 hour and weight decreased
      if (timeDiffHours > 0 && timeDiffHours <= 1 && weightDiff > 0) {
        const dropPerHour = weightDiff / timeDiffHours;
        const state = this.alertStates.get(AlertType.WEIGHT_DROP)!;

        const threshold = this.thresholds.maxWeightDropPerHourKg;
        const clearThreshold = threshold * (1 - this.HYSTERESIS_PERCENT);

        if (dropPerHour > threshold && !state.isActive) {
          await this.triggerAlert(
            AlertType.WEIGHT_DROP,
            `Sudden weight loss detected: ${dropPerHour.toFixed(3)} kg/hour (threshold ${threshold} kg/hour) - possible robbery or swarming`,
            dropPerHour,
          );
        } else if (dropPerHour <= clearThreshold && state.isActive) {
          await this.clearAlert(
            AlertType.WEIGHT_DROP,
            `Weight drop normalized: ${dropPerHour.toFixed(3)} kg/hour`,
            dropPerHour,
          );
        }
      }
    }

    // Update tracking variables
    this.lastWeight = currentWeight;
    this.lastWeightTime = currentTime;
  }

  /**
   * Check sound alerts with hysteresis
   * Monitors sound levels outside acceptable range
   * 
   * @param data - Telemetry data containing sound level
   */
  private async checkSoundAlerts(data: any) {
    const sound = data.soundDb;
    const state = this.alertStates.get(AlertType.SOUND_ANOMALY)!;

    const maxThreshold = this.thresholds.soundMax;
    const minThreshold = this.thresholds.soundMin;
    const maxClearThreshold = maxThreshold * (1 - this.HYSTERESIS_PERCENT);
    const minClearThreshold = minThreshold * (1 + this.HYSTERESIS_PERCENT);

    const isAnomaly = sound > maxThreshold || sound < minThreshold;
    const isNormal = sound <= maxClearThreshold && sound >= minClearThreshold;

    if (isAnomaly && !state.isActive) {
      const direction = sound > maxThreshold ? 'high' : 'low';
      await this.triggerAlert(
        AlertType.SOUND_ANOMALY,
        `Sound level ${direction}: ${sound} dB (range ${minThreshold}-${maxThreshold} dB)`,
        sound,
      );
    } else if (isNormal && state.isActive) {
      await this.clearAlert(
        AlertType.SOUND_ANOMALY,
        `Sound level normalized: ${sound} dB`,
        sound,
      );
    }
  }

  /**
   * Check CO2 alerts with hysteresis
   * Monitors CO2 levels above threshold
   * 
   * @param data - Telemetry data containing CO2 level
   */
  private async checkCo2Alerts(data: any) {
    const co2 = data.co2Ppm;
    const state = this.alertStates.get(AlertType.CO2_HIGH)!;

    const threshold = this.thresholds.co2Max;
    const clearThreshold = threshold * (1 - this.HYSTERESIS_PERCENT);

    if (co2 > threshold && !state.isActive) {
      await this.triggerAlert(
        AlertType.CO2_HIGH,
        `CO2 level high: ${co2} ppm (threshold ${threshold} ppm)`,
        co2,
      );
    } else if (co2 < clearThreshold && state.isActive) {
      await this.clearAlert(
        AlertType.CO2_HIGH,
        `CO2 level normalized: ${co2} ppm`,
        co2,
      );
    }
  }

  /**
   * Check swarm risk alerts with hysteresis
   * Monitors swarm risk score above threshold
   * 
   * @param data - Telemetry data containing swarm risk
   */
  private async checkSwarmRiskAlerts(data: any) {
    const swarmRisk = data.swarmRisk;
    const state = this.alertStates.get(AlertType.SWARM_RISK)!;

    const threshold = this.thresholds.swarmRiskMax;
    const clearThreshold = threshold * (1 - this.HYSTERESIS_PERCENT);

    if (swarmRisk > threshold && !state.isActive) {
      await this.triggerAlert(
        AlertType.SWARM_RISK,
        `Swarm risk very high: ${swarmRisk}/100 (threshold ${threshold}) – immediate inspection recommended`,
        swarmRisk,
      );
    } else if (swarmRisk < clearThreshold && state.isActive) {
      await this.clearAlert(
        AlertType.SWARM_RISK,
        `Swarm risk normalized: ${swarmRisk}/100`,
        swarmRisk,
      );
    }
  }

  /**
   * Check battery alerts with hysteresis
   * Monitors battery level below threshold
   * 
   * @param data - Telemetry data containing battery level
   */
  private async checkBatteryAlerts(data: any) {
    const battery = data.batteryPercent;
    const state = this.alertStates.get(AlertType.BATTERY_LOW)!;

    const threshold = this.thresholds.batteryMin;
    const clearThreshold = threshold * (1 + this.HYSTERESIS_PERCENT);

    if (battery < threshold && !state.isActive) {
      await this.triggerAlert(
        AlertType.BATTERY_LOW,
        `Battery level low: ${battery}% (threshold ${threshold}%) – please recharge device`,
        battery,
      );
    } else if (battery > clearThreshold && state.isActive) {
      await this.clearAlert(
        AlertType.BATTERY_LOW,
        `Battery level normalized: ${battery}%`,
        battery,
      );
    }
  }

  /**
   * Check honey gain alerts with hysteresis
   * Monitors daily honey gain below threshold
   * 
   * @param data - Telemetry data containing daily honey gain
   */
  private async checkHoneyGainAlerts(data: any) {
    const honeyGain = data.dailyHoneyGainG;
    if (honeyGain === null || honeyGain === undefined) return;

    const state = this.alertStates.get(AlertType.HONEY_GAIN_LOW)!;
    const threshold = this.thresholds.minDailyHoneyGainG;
    const clearThreshold = threshold * (1 + this.HYSTERESIS_PERCENT);

    if (honeyGain < threshold && !state.isActive) {
      await this.triggerAlert(
        AlertType.HONEY_GAIN_LOW,
        `Daily honey gain below threshold: ${honeyGain} g (threshold ${threshold} g)`,
        honeyGain,
      );
    } else if (honeyGain > clearThreshold && state.isActive) {
      await this.clearAlert(
        AlertType.HONEY_GAIN_LOW,
        `Honey gain normalized: ${honeyGain} g`,
        honeyGain,
      );
    }
  }

  /**
   * Trigger an alert with debouncing
   * Only triggers if state changes and debounce period has passed
   * Writes to event_logs and emits 'alert.triggered' event
   * 
   * @param type - Alert type
   * @param message - Human-readable alert message
   * @param value - Current sensor value that triggered the alert
   */
  private async triggerAlert(type: AlertType, message: string, value: number) {
    const state = this.alertStates.get(type)!;

    // Check debounce: prevent triggering if last trigger was within debounce period
    if (state.lastTriggeredAt) {
      const timeSinceLastTrigger = Date.now() - state.lastTriggeredAt.getTime();
      if (timeSinceLastTrigger < this.DEBOUNCE_MS) {
        this.logger.debug(
          `Alert ${type} debounced (${Math.round(timeSinceLastTrigger / 1000)}s since last trigger)`,
        );
        return;
      }
    }

    // Clear any pending debounce timer
    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
      state.debounceTimer = null;
    }

    // Update state
    state.isActive = true;
    state.lastTriggeredAt = new Date();
    state.lastValue = value;

    // Write to event_logs (state change: enter alert)
    try {
      await this.db.db.insert(eventLogs).values({
        hiveId: HIVE_ID,
        type,
        message,
      });

      // Emit event for other services (e.g., WebSocket gateway, notifications)
      this.eventEmitter.emit('alert.triggered', {
        type,
        message,
        value,
        hiveId: HIVE_ID,
        timestamp: new Date(),
      });

      this.logger.warn(`🚨 Alert triggered: ${type} - ${message}`);
    } catch (error) {
      this.logger.error(`Failed to log alert ${type}`, error);
    }
  }

  /**
   * Clear an alert with debouncing
   * Only clears if state changes and debounce period has passed
   * Writes to event_logs and emits 'alert.cleared' event
   * 
   * @param type - Alert type
   * @param message - Human-readable clear message
   * @param value - Current sensor value that cleared the alert
   */
  private async clearAlert(type: AlertType, message: string, value: number) {
    const state = this.alertStates.get(type)!;

    if (!state.isActive) return;

    // Check debounce: prevent clearing if last clear was within debounce period
    if (state.lastClearedAt) {
      const timeSinceLastClear = Date.now() - state.lastClearedAt.getTime();
      if (timeSinceLastClear < this.DEBOUNCE_MS) {
        this.logger.debug(
          `Alert ${type} clear debounced (${Math.round(timeSinceLastClear / 1000)}s since last clear)`,
        );
        return;
      }
    }

    // Update state
    state.isActive = false;
    state.lastClearedAt = new Date();
    state.lastValue = value;

    // Write to event_logs (state change: exit alert)
    try {
      await this.db.db.insert(eventLogs).values({
        hiveId: HIVE_ID,
        type: `${type}_CLEARED`,
        message,
      });

      // Emit event for other services
      this.eventEmitter.emit('alert.cleared', {
        type,
        message,
        value,
        hiveId: HIVE_ID,
        timestamp: new Date(),
      });

      this.logger.log(`✅ Alert cleared: ${type} - ${message}`);
    } catch (error) {
      this.logger.error(`Failed to log alert clear ${type}`, error);
    }
  }
}

