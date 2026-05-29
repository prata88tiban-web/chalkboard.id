import { pgTable, serial, varchar, boolean, timestamp, text } from 'drizzle-orm/pg-core';

export const systemSettings = pgTable('system_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value').notNull(),
  description: varchar('description', { length: 255 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;

export const printers = pgTable('printers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // usb, ip
  address: varchar('address', { length: 255 }).notNull(), // IP address or USB port path
  location: varchar('location', { length: 50 }).notNull(), // cashier, kitchen, bar
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Printer = typeof printers.$inferSelect;
export type NewPrinter = typeof printers.$inferInsert;