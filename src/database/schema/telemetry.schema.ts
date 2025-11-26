import { mysqlTable, bigint, varchar, double, int, timestamp } from 'drizzle-orm/mysql-core';

export const telemetry = mysqlTable('telemetry', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  hiveId: varchar('hive_id', { length: 50 }).notNull().default('BERLIN-ROOFTOP-01'),
  recordedAt: timestamp('recorded_at', { mode: 'date', fsp: 3 }).notNull().defaultNow(),

  temperature: double('temperature').notNull(),
  humidity: double('humidity').notNull(),
  weightKg: double('weight_kg').notNull(),
  soundDb: int('sound_db').notNull(),
  co2Ppm: int('co2_ppm').notNull(),
  dailyHoneyGainG: int('daily_honey_gain_g'),
  swarmRisk: int('swarm_risk').notNull(),
  batteryPercent: double('battery_percent').notNull(),
});

