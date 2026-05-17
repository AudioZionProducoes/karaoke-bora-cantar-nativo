import { Router, type IRouter } from "express";
import { ilike, or, sql, eq, count, inArray } from "drizzle-orm";
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
    .from(musicasTable)
    .where(eq(musicasTable.hasVideo, true));

  const [totalArtistsRow] = await db
    .select({ count: sql<number>`count(distinct ${musicasTable.artista})` })
    .from(musicasTable)
    .where(eq(musicasTable.hasVideo, true));

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

  // If query is a pure number, search ONLY by exact ID
  const isNumeric = searchTerm ? /^\d+$/.test(searchTerm) : false;
  const numericId = isNumeric ? parseInt(searchTerm!, 10) : null;

  // Only show songs that have video available
  const hasVideoFilter = eq(musicasTable.hasVideo, true);

  const searchWhere = searchTerm
    ? isNumeric
      ? eq(musicasTable.id, numericId!)
      : or(
          ilike(musicasTable.musica, `%${searchTerm}%`),
          ilike(musicasTable.artista, `%${searchTerm}%`),
          ilike(musicasTable.inicio, `%${searchTerm}%`),
        )
    : undefined;

  const where = searchWhere
    ? sql`${searchWhere} AND ${hasVideoFilter}`
    : hasVideoFilter;

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

router.post("/musicas/sync-videos", async (req, res): Promise<void> => {
  const { ids } = req.body as { ids: number[] };

  if (!Array.isArray(ids)) {
    res.status(400).json({ error: "ids deve ser um array de números" });
    return;
  }

  // Mark all passed IDs as having video
  const validIds = ids.filter((id) => Number.isInteger(id) && id > 0);

  let synced = 0;
  let cleared = 0;

  if (validIds.length > 0) {
    // First clear all videos not in the list
    const clearResult = await db
      .update(musicasTable)
      .set({ hasVideo: false })
      .where(sql`${musicasTable.hasVideo} = true AND ${musicasTable.id} NOT IN (${sql.join(validIds)})`);
    cleared = clearResult.rowCount ?? 0;

    // Then mark the provided IDs as having video
    const syncResult = await db
      .update(musicasTable)
      .set({ hasVideo: true })
      .where(inArray(musicasTable.id, validIds));
    synced = syncResult.rowCount ?? 0;
  } else {
    // If no IDs provided, clear all
    const clearResult = await db
      .update(musicasTable)
      .set({ hasVideo: false })
      .where(eq(musicasTable.hasVideo, true));
    cleared = clearResult.rowCount ?? 0;
  }

  res.json({ synced, cleared });
});

/**
 * Sync with Bunny Stream — fetch all videos from the library
 * and mark corresponding songs as having video.
 *
 * Requires BUNNY_API_KEY and BUNNY_LIBRARY_ID env vars.
 */
router.post("/musicas/sync-bunny", async (req, res): Promise<void> => {
  const apiKey = process.env["BUNNY_API_KEY"];
  const libraryId = process.env["BUNNY_LIBRARY_ID"];

  if (!apiKey || !libraryId) {
    res.status(503).json({
      error: "BUNNY_API_KEY e BUNNY_LIBRARY_ID precisam estar configurados no servidor.",
    });
    return;
  }

  try {
    // Bunny Stream API: list all videos in the library
    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=1000`,
      {
        headers: {
          AccessKey: apiKey,
          accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      const err = await response.text();
      res.status(502).json({ error: "Erro na Bunny Stream API", details: err });
      return;
    }

    const data = (await response.json()) as { items?: Array<{ guid?: string; id?: string }> };
    const items = data.items ?? [];

    // Bunny Stream uses GUID as video ID; try to parse numeric ID from it
    const videoIds: number[] = [];
    for (const item of items) {
      const guid = item.guid ?? item.id ?? "";
      // Try to extract numeric ID from guid (e.g. "12345" or "video-12345")
      const match = guid.match(/(\d+)/);
      if (match) {
        const id = parseInt(match[1]!, 10);
        if (!Number.isNaN(id) && id > 0) {
          videoIds.push(id);
        }
      }
    }

    // Sync the extracted IDs
    let synced = 0;
    let cleared = 0;

    if (videoIds.length > 0) {
      const clearResult = await db
        .update(musicasTable)
        .set({ hasVideo: false })
        .where(sql`${musicasTable.hasVideo} = true AND ${musicasTable.id} NOT IN (${sql.join(videoIds)})`);
      cleared = clearResult.rowCount ?? 0;

      const syncResult = await db
        .update(musicasTable)
        .set({ hasVideo: true })
        .where(inArray(musicasTable.id, videoIds));
      synced = syncResult.rowCount ?? 0;
    } else {
      const clearResult = await db
        .update(musicasTable)
        .set({ hasVideo: false })
        .where(eq(musicasTable.hasVideo, true));
      cleared = clearResult.rowCount ?? 0;
    }

    res.json({
      synced,
      cleared,
      totalVideos: items.length,
      matched: videoIds.length,
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao sincronizar com Bunny Stream", details: String(err) });
  }
});

export default router;
