import { pgTable, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const musicasTable = pgTable("musicas", {
  id: integer("id").primaryKey(),
  artista: text("artista").notNull(),
  musica: text("musica").notNull(),
  inicio: text("inicio"),
});

export const insertMusicaSchema = createInsertSchema(musicasTable);
export type InsertMusica = z.infer<typeof insertMusicaSchema>;
export type Musica = typeof musicasTable.$inferSelect;
