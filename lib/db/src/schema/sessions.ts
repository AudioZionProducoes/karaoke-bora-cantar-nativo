import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export interface QueueEntry {
  id: number;
  musica: string;
  artista: string;
  singerName: string;
  addedBy: string;
  addedAt: string;
}

export const sessionsTable = pgTable("karaoke_sessions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  mode: text("mode").notNull().default("home"),
  queue: jsonb("queue").$type<QueueEntry[]>().notNull().default([]),
  currentSongId: text("current_song_id"),
  currentSingerName: text("current_singer_name"),
  currentSongAddedBy: text("current_song_added_by"),
  currentSongStartedAt: timestamp("current_song_started_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
