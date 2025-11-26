import { mysqlTable, varchar, double, int } from 'drizzle-orm/mysql-core';

export const thresholds = mysqlTable('thresholds', {
  hiveId: varchar('hive_id', { length: 50 }).primaryKey(),
  tempMin: double('temp_min').notNull(),
  tempMax: double('temp_max').notNull(),
  humidityMin: double('humidity_min').notNull(),
  humidityMax: double('humidity_max').notNull(),
  maxWeightDropPerHourKg: double('max_weight_drop_per_hour_kg').notNull(),
  soundMin: int('sound_min').notNull(),
  soundMax: int('sound_max').notNull(),
  co2Max: int('co2_max').notNull(),
  minDailyHoneyGainG: int('min_daily_honey_gain_g').notNull(),
  swarmRiskMax: int('swarm_risk_max').notNull(),
  batteryMin: double('battery_min').notNull(),
});

