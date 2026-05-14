import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const karaokeUsersTable = pgTable("karaoke_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  woocommerceCustomerId: text("woocommerce_customer_id"),
  subscriptionStatus: text("subscription_status").notNull().default("active"),
  accessGranted: boolean("access_granted").notNull().default(true),
  accessGrantedAt: timestamp("access_granted_at", { withTimezone: true }).defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const insertKaraokeUserSchema = createInsertSchema(karaokeUsersTable).omit({ id: true });
export type InsertKaraokeUser = z.infer<typeof insertKaraokeUserSchema>;
export type KaraokeUser = typeof karaokeUsersTable.$inferSelect;
