import { mysqlTable, bigint, varchar, timestamp, text } from 'drizzle-orm/mysql-core';

export const eventLogs = mysqlTable('event_logs', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().autoincrement(),
  hiveId: varchar('hive_id', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date', fsp: 3 }).notNull().defaultNow(),
  type: varchar('type', { length: 50 }).notNull(),
  message: text('message').notNull(),
});

