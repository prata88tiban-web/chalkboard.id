import { pgTable, serial, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

export const queues = pgTable('queues', {
  id: serial('id').primaryKey(),
  customerName: varchar('customer_name', { length: 100 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }),
  groupSize: integer('group_size').default(1).notNull(),
  status: varchar('status', { length: 20 }).default('waiting'), // waiting, called, cancelled, seated
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Queue = typeof queues.$inferSelect;
export type NewQueue = typeof queues.$inferInsert;
