import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, sessionsTable } from "@workspace/db";
import type { QueueEntry } from "@workspace/db";

function generateId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "";
  for (let i = 0; i < 6; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
}

function getDeviceId(req: { headers: { [k: string]: unknown } }): string {
  const header = req.headers["x-device-id"];
  return typeof header === "string" && header.trim() ? header.trim() : "anon";
}

// Express Request wrapper for type safety
type ExpressReq = Parameters<Parameters<IRouter["post"]>[1]>[0];

const router: IRouter = Router();

router.get("/sessions", async (req, res): Promise<void> => {
  res.status(200).json({ message: "Use POST to create a session" });
});

router.post("/sessions", async (req, res): Promise<void> => {
  const name = typeof req.body?.name === "string" && req.body.name.trim()
    ? req.body.name.trim()
    : "Sessão";

  // Try up to 10 times to get a unique ID
  for (let attempt = 0; attempt < 10; attempt++) {
    const id = generateId();
    try {
      const [session] = await db
        .insert(sessionsTable)
        .values({ id, name, queue: [] })
        .returning();
      res.status(201).json({ id: session.id, name: session.name });
      return;
    } catch {
      // ID collision, try again
    }
  }
  res.status(500).json({ error: "Não foi possível criar uma sessão. Tente novamente." });
});

router.get("/sessions/:id", async (req, res): Promise<void> => {
  const id = req.params.id?.toUpperCase();
  if (!id || id.length !== 6) {
    res.status(400).json({ error: "ID de sessão inválido" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Sessão não encontrada" });
    return;
  }

  res.json(session);
});

router.post("/sessions/:id/queue", async (req: ExpressReq, res): Promise<void> => {
  const id = req.params.id?.toUpperCase();
  const { id: songId, musica, artista, singerName } = req.body ?? {};

  if (!id || id.length !== 6) {
    res.status(400).json({ error: "ID de sessão inválido" });
    return;
  }
  if (!songId || typeof musica !== "string" || typeof artista !== "string") {
    res.status(400).json({ error: "Dados da música incompletos" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Sessão não encontrada" });
    return;
  }

  const queue: QueueEntry[] = (session.queue as QueueEntry[]) ?? [];
  if (queue.length >= 30) {
    res.status(400).json({ error: "Fila cheia (máximo 30 músicas)" });
    return;
  }
  if (queue.some((q) => q.id === songId)) {
    res.status(409).json({ error: "Música já está na fila" });
    return;
  }

  const entry: QueueEntry = {
    id: Number(songId),
    musica,
    artista,
    singerName: typeof singerName === "string" ? singerName.trim() : "Anônimo",
    addedBy: getDeviceId(req),
    addedAt: new Date().toISOString(),
  };
  const updatedQueue = [...queue, entry];

  await db
    .update(sessionsTable)
    .set({ queue: updatedQueue, updatedAt: new Date() })
    .where(eq(sessionsTable.id, id));

  res.status(201).json({ queue: updatedQueue });
});

router.delete("/sessions/:id/queue/:songId", async (req: ExpressReq, res): Promise<void> => {
  const id = req.params.id?.toUpperCase();
  const songId = Number(req.params.songId);

  if (!id || id.length !== 6 || Number.isNaN(songId)) {
    res.status(400).json({ error: "Parâmetros inválidos" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Sessão não encontrada" });
    return;
  }

  const queue: QueueEntry[] = (session.queue as QueueEntry[]) ?? [];
  const item = queue.find((q) => q.id === songId);
  if (!item) {
    res.status(404).json({ error: "Música não encontrada na fila" });
    return;
  }

  const deviceId = getDeviceId(req);
  if (item.addedBy && item.addedBy !== "anon" && item.addedBy !== deviceId) {
    res.status(403).json({ error: "Você só pode apagar músicas que você adicionou" });
    return;
  }

  const updatedQueue = queue.filter((q) => q.id !== songId);

  await db
    .update(sessionsTable)
    .set({ queue: updatedQueue, updatedAt: new Date() })
    .where(eq(sessionsTable.id, id));

  res.json({ queue: updatedQueue });
});

router.post("/sessions/:id/play", async (req, res): Promise<void> => {
  const id = req.params.id?.toUpperCase();
  const { songId } = req.body ?? {};

  if (!id || id.length !== 6) {
    res.status(400).json({ error: "ID de sessão inválido" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Sessão não encontrada" });
    return;
  }

  // If playing from queue, grab the singer name
  const queue: QueueEntry[] = (session.queue as QueueEntry[]) ?? [];
  const fromQueue = queue.find((q) => q.id === Number(songId));

  await db
    .update(sessionsTable)
    .set({
      currentSongId: songId ? String(songId) : null,
      currentSingerName: fromQueue?.singerName ?? null,
      currentSongStartedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(sessionsTable.id, id));

  res.json({ currentSongId: songId ?? null, currentSingerName: fromQueue?.singerName ?? null });
});

router.put("/sessions/:id/queue/:songId", async (req: ExpressReq, res): Promise<void> => {
  const id = req.params.id?.toUpperCase();
  const songId = Number(req.params.songId);
  const { musica, artista } = req.body ?? {};

  if (!id || id.length !== 6 || Number.isNaN(songId)) {
    res.status(400).json({ error: "Parâmetros inválidos" });
    return;
  }
  if (typeof musica !== "string" || typeof artista !== "string") {
    res.status(400).json({ error: "Dados da música incompletos" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Sessão não encontrada" });
    return;
  }

  const queue: QueueEntry[] = (session.queue as QueueEntry[]) ?? [];
  const item = queue.find((q) => q.id === songId);
  if (!item) {
    res.status(404).json({ error: "Música não encontrada na fila" });
    return;
  }

  const deviceId = getDeviceId(req);
  if (item.addedBy && item.addedBy !== "anon" && item.addedBy !== deviceId) {
    res.status(403).json({ error: "Você só pode editar músicas que você adicionou" });
    return;
  }

  // Update musica and artista, keep singerName and addedAt
  const updatedQueue = queue.map((q) =>
    q.id === songId ? { ...q, musica, artista } : q
  );

  await db
    .update(sessionsTable)
    .set({ queue: updatedQueue, updatedAt: new Date() })
    .where(eq(sessionsTable.id, id));

  res.json({ queue: updatedQueue });
});

router.post("/sessions/:id/next", async (req, res): Promise<void> => {
  const id = req.params.id?.toUpperCase();

  if (!id || id.length !== 6) {
    res.status(400).json({ error: "ID de sessão inválido" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Sessão não encontrada" });
    return;
  }

  const queue: QueueEntry[] = (session.queue as QueueEntry[]) ?? [];
  const next = queue.length > 0 ? queue[0] : null;
  const updatedQueue = queue.slice(1);

  await db
    .update(sessionsTable)
    .set({
      queue: updatedQueue,
      currentSongId: next ? String(next.id) : null,
      currentSingerName: next?.singerName ?? null,
      currentSongStartedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(sessionsTable.id, id));

  res.json({ next, queue: updatedQueue });
});

export default router;
