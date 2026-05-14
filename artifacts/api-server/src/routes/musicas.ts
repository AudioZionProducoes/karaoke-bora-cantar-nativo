import { Router, type IRouter } from "express";
import { ilike, or, sql, eq, count } from "drizzle-orm";
import { db, musicasTable } from "@workspace/db";
import {
  SearchMusicasQueryParams,
  GetMusicaParams,
  UpdateMusicaParams,
  UpdateMusicaBody,
  DeleteMusicaParams,
  CreateMusicaBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/musicas/stats", async (req, res): Promise<void> => {
  const [totalSongsRow] = await db
    .select({ count: count() })
    .from(musicasTable);

  const [totalArtistsRow] = await db
    .select({ count: sql<number>`count(distinct ${musicasTable.artista})` })
    .from(musicasTable);

  res.json({
    totalSongs: Number(totalSongsRow?.count ?? 0),
    totalArtists: Number(totalArtistsRow?.count ?? 0),
  });
});

router.get("/musicas/search", async (req, res): Promise<void> => {
  const parsed = SearchMusicasQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q, page = 1, limit = 24 } = parsed.data;
  const offset = (page - 1) * limit;

  const searchTerm = q?.trim();

  // Check if query is a pure number — enable exact + partial ID matching
  const numericId = searchTerm && /^\d+$/.test(searchTerm) ? parseInt(searchTerm, 10) : null;

  const where = searchTerm
    ? or(
        ilike(musicasTable.musica, `%${searchTerm}%`),
        ilike(musicasTable.artista, `%${searchTerm}%`),
        ilike(musicasTable.inicio, `%${searchTerm}%`),
        sql`CAST(${musicasTable.id} AS TEXT) LIKE ${"%" + searchTerm + "%"}`,
        ...(numericId !== null ? [eq(musicasTable.id, numericId)] : []),
      )
    : undefined;

  const [data, [totalRow]] = await Promise.all([
    db
      .select()
      .from(musicasTable)
      .where(where)
      .orderBy(musicasTable.artista)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(musicasTable)
      .where(where),
  ]);

  const total = Number(totalRow?.count ?? 0);

  res.json({
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/musicas/:id", async (req, res): Promise<void> => {
  const params = GetMusicaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [musica] = await db
    .select()
    .from(musicasTable)
    .where(eq(musicasTable.id, params.data.id));

  if (!musica) {
    res.status(404).json({ error: "Música não encontrada" });
    return;
  }

  res.json(musica);
});

router.post("/musicas", async (req, res): Promise<void> => {
  const parsed = CreateMusicaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select({ id: musicasTable.id })
    .from(musicasTable)
    .where(eq(musicasTable.id, parsed.data.id));

  if (existing.length > 0) {
    res.status(409).json({ error: `ID ${parsed.data.id} já existe no catálogo` });
    return;
  }

  const [musica] = await db
    .insert(musicasTable)
    .values({
      id: parsed.data.id,
      artista: parsed.data.artista.trim(),
      musica: parsed.data.musica.trim(),
      inicio: parsed.data.inicio?.trim() ?? null,
    })
    .returning();

  res.status(201).json(musica);
});

router.put("/musicas/:id", async (req, res): Promise<void> => {
  const params = UpdateMusicaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMusicaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const values: Record<string, string | null> = {};
  if (parsed.data.artista != null) values.artista = parsed.data.artista.trim();
  if (parsed.data.musica != null) values.musica = parsed.data.musica.trim();
  if (parsed.data.inicio != null) values.inicio = parsed.data.inicio.trim();

  if (Object.keys(values).length === 0) {
    res.status(400).json({ error: "Nenhum campo para atualizar" });
    return;
  }

  const [musica] = await db
    .update(musicasTable)
    .set(values)
    .where(eq(musicasTable.id, params.data.id))
    .returning();

  if (!musica) {
    res.status(404).json({ error: "Música não encontrada" });
    return;
  }

  res.json(musica);
});

router.delete("/musicas/:id", async (req, res): Promise<void> => {
  const params = DeleteMusicaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [musica] = await db
    .delete(musicasTable)
    .where(eq(musicasTable.id, params.data.id))
    .returning();

  if (!musica) {
    res.status(404).json({ error: "Música não encontrada" });
    return;
  }

  res.sendStatus(204);
});

export default router;
