import { pgTable, integer, text, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const musicasTable = pgTable("musicas", {
  id: integer("id").primaryKey(),
  artista: text("artista").notNull(),
  musica: text("musica").notNull(),
  inicio: text("inicio"),
  hasVideo: boolean("has_video").default(false),
  bunnyGuid: text("bunny_guid"), // Bunny Stream video GUID
  duration: integer("duration"), // Duration in seconds (e.g. 215 for 3:35)
});

export const insertMusicaSchema = createInsertSchema(musicasTable);
export type InsertMusica = z.infer<typeof insertMusicaSchema>;
export type Musica = typeof musicasTable.$inferSelect;
