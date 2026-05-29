import { pgTable, serial, varchar, decimal, timestamp, integer } from 'drizzle-orm/pg-core';
import { staff } from './fnb';

export const shifts = pgTable('shifts', {
  id: serial('id').primaryKey(),
  staffId: integer('staff_id').references(() => staff.id).notNull(),
  startTime: timestamp('start_time').defaultNow().notNull(),
  endTime: timestamp('end_time'),
  startBalance: decimal('start_balance', { precision: 10, scale: 2 }).notNull(),
  endBalance: decimal('end_balance', { precision: 10, scale: 2 }), // Expected balance based on transactions
  actualCash: decimal('actual_cash', { precision: 10, scale: 2 }), // Actually counted cash
  notes: varchar('notes', { length: 255 }),
  status: varchar('status', { length: 20 }).default('open'), // open, closed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Shift = typeof shifts.$inferSelect;
export type NewShift = typeof shifts.$inferInsert;
