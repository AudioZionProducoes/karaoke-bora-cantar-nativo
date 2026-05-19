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
  redeemerName: text("redeemer_name"),
  redeemerEmail: text("redeemer_email"),
  redeemerWhatsapp: text("redeemer_whatsapp"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  // Cupom validity: when the code itself becomes unusable (before redeem)
  validityType: text("validity_type").notNull().default("never"), // 'never' | 'scheduled'
  codeExpiresAt: timestamp("code_expires_at", { withTimezone: true }),
  marketingConsent: boolean("marketing_consent").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  createdBy: integer("created_by"), // admin user id
});

export const insertAccessCodeSchema = createInsertSchema(accessCodesTable)
  .omit({ id: true, createdAt: true, usedAt: true, usedBy: true, expiresAt: true, redeemerName: true, redeemerEmail: true, redeemerWhatsapp: true, codeExpiresAt: true })
  .extend({
    codeExpiresAt: z.string().datetime().optional(),
  });
export type InsertAccessCode = z.infer<typeof insertAccessCodeSchema>;
export type AccessCode = typeof accessCodesTable.$inferSelect;
