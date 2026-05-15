import { pgTable, serial, varchar, integer, boolean, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accessCodesTable = pgTable("access_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  durationMinutes: integer("duration_minutes").notNull(),
  label: text("label"),
  used: boolean("used").notNull().default(false),
  usedAt: timestamp("used_at", { withTimezone: true }),
  usedBy: text("used_by"), // email or session id of who redeemed
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: integer("created_by"), // admin user id
});

export const insertAccessCodeSchema = createInsertSchema(accessCodesTable).omit({ id: true, createdAt: true, usedAt: true, usedBy: true, expiresAt: true });
export type InsertAccessCode = z.infer<typeof insertAccessCodeSchema>;
export type AccessCode = typeof accessCodesTable.$inferSelect;
