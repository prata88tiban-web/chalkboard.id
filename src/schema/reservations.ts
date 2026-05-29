import { pgTable, serial, varchar, timestamp, integer } from 'drizzle-orm/pg-core';
import { tables } from './tables';

export const reservations = pgTable('reservations', {
  id: serial('id').primaryKey(),
  tableId: integer('table_id').references(() => tables.id),
  customerName: varchar('customer_name', { length: 100 }).notNull(),
  customerPhone: varchar('customer_phone', { length: 20 }),
  scheduledTime: timestamp('scheduled_time').notNull(),
  duration: integer('duration').notNull(), // in minutes
  status: varchar('status', { length: 20 }).default('confirmed'), // confirmed, cancelled, completed, checked-in
  notes: varchar('notes', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
