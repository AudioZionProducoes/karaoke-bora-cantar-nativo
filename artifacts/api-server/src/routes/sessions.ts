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
  const mode = req.body?.mode === "party" ? "party" : "home";

  // Try up to 10 times to get a unique ID
  for (let attempt = 0; attempt < 10; attempt++) {
    const id = generateId();
    try {
      const [session] = await db
        .insert(sessionsTable)
        .values({ id, name, mode, queue: [] })
        .returning();
      res.status(201).json({ id: session.id, name: session.name, mode: session.mode });
      return;
    } catch {
      // ID collision, try again
    }
  }
  res.status(500).json({ error: "Não foi possível criar uma sessão. Tente novamente." });
});

router.patch("/sessions/:id", async (req, res): Promise<void> => {
  const id = String(req.params.id ?? "").toUpperCase();
  if (!id || id.length !== 6) {
    res.status(400).json({ error: "ID de sessão inválido" });
    return;
  }

  const mode = req.body?.mode;
  if (mode !== "party" && mode !== "home") {
    res.status(400).json({ error: "Modo inválido. Use 'party' ou 'home'." });
    return;
  }

  try {
    const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
    if (!session) {
      res.status(404).json({ error: "Sessão não encontrada" });
      return;
    }

    const [updated] = await db
      .update(sessionsTable)
      .set({ mode })
      .where(eq(sessionsTable.id, id))
      .returning();

    res.json({ id: updated.id, name: updated.name, mode: updated.mode });
  } catch {
    res.status(500).json({ error: "Erro ao atualizar modo da sessão" });
  }
});

router.get("/sessions/:id", async (req, res): Promise<void> => {
  const id = String(req.params.id ?? "").toUpperCase();
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
  const id = String(req.params.id ?? "").toUpperCase();
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

  const deviceId = getDeviceId(req);

  // Party mode: each device can only have 1 song in the queue at a time
  if (session.mode === "party") {
    const hasSongInQueue = queue.some((q) => q.addedBy === deviceId);
    if (hasSongInQueue) {
      res.status(429).json({ error: "Modo Festa: você já tem uma música na fila. Aguarde sua vez para adicionar outra." });
      return;
    }
  }

  const entry: QueueEntry = {
    id: Number(songId),
    musica,
    artista,
    singerName: typeof singerName === "string" ? singerName.trim() : "Anônimo",
    addedBy: deviceId,
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
  const id = String(req.params.id ?? "").toUpperCase();
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

router.post("/sessions/:id/play", async (req: ExpressReq, res): Promise<void> => {
  const id = String(req.params.id ?? "").toUpperCase();
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

  // If playing from queue, grab the singer name and device
  const queue: QueueEntry[] = (session.queue as QueueEntry[]) ?? [];
  const fromQueue = queue.find((q) => q.id === Number(songId));

  await db
    .update(sessionsTable)
    .set({
      currentSongId: songId ? String(songId) : null,
      currentSingerName: fromQueue?.singerName ?? null,
      currentSongAddedBy: fromQueue?.addedBy ?? null,
      currentSongStartedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(sessionsTable.id, id));

  res.json({ currentSongId: songId ?? null, currentSingerName: fromQueue?.singerName ?? null });
});

router.put("/sessions/:id/queue/:songId", async (req: ExpressReq, res): Promise<void> => {
  const id = String(req.params.id ?? "").toUpperCase();
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

router.post("/sessions/:id/next", async (req: ExpressReq, res): Promise<void> => {
  const id = String(req.params.id ?? "").toUpperCase();

  if (!id || id.length !== 6) {
    res.status(400).json({ error: "ID de sessão inválido" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Sessão não encontrada" });
    return;
  }

  // Only the singer who added the current song can skip it
  const deviceId = getDeviceId(req);
  if (session.currentSongAddedBy && session.currentSongAddedBy !== "anon" && session.currentSongAddedBy !== deviceId) {
    res.status(403).json({ error: "Apenas quem colocou a música atual na fila pode pular para a próxima." });
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
      currentSongAddedBy: next?.addedBy ?? null,
      currentSongStartedAt: new Date(),
      swapRequest: null,
      updatedAt: new Date(),
    })
    .where(eq(sessionsTable.id, id));

  res.json({ next, queue: updatedQueue });
});

/* ==========================
   SWAP REQUEST (Troca a Fila)
   ========================== */

router.post("/sessions/:id/swap", async (req: ExpressReq, res): Promise<void> => {
  const id = String(req.params.id ?? "").toUpperCase();
  const { targetIndex } = req.body ?? {};

  if (!id || id.length !== 6) {
    res.status(400).json({ error: "ID de sessão inválido" });
    return;
  }
  if (typeof targetIndex !== "number" || targetIndex < 0) {
    res.status(400).json({ error: "Índice inválido" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Sessão não encontrada" });
    return;
  }

  const queue: QueueEntry[] = (session.queue as QueueEntry[]) ?? [];
  const deviceId = getDeviceId(req);

  // Find the requester's position in the queue
  const requesterIndex = queue.findIndex((q) => q.addedBy === deviceId);
  if (requesterIndex === -1) {
    res.status(400).json({ error: "Você não tem uma música na fila para trocar" });
    return;
  }
  if (targetIndex >= queue.length) {
    res.status(400).json({ error: "Índice inválido" });
    return;
  }
  if (requesterIndex === targetIndex) {
    res.status(400).json({ error: "Você não pode trocar com você mesmo" });
    return;
  }
  if (session.swapRequest) {
    res.status(409).json({ error: "Já existe uma troca pendente. Aguarde a resposta." });
    return;
  }

  const requester = queue[requesterIndex];
  const target = queue[targetIndex];

  const swapReq = {
    requesterDeviceId: deviceId,
    requesterName: requester.singerName,
    targetDeviceId: target.addedBy,
    targetName: target.singerName,
    requesterIndex,
    targetIndex,
    status: "pending" as const,
    requestedAt: new Date().toISOString(),
  };

  await db
    .update(sessionsTable)
    .set({ swapRequest: swapReq, updatedAt: new Date() })
    .where(eq(sessionsTable.id, id));

  res.status(201).json({ swapRequest: swapReq });
});

router.post("/sessions/:id/swap/accept", async (req: ExpressReq, res): Promise<void> => {
  const id = String(req.params.id ?? "").toUpperCase();

  if (!id || id.length !== 6) {
    res.status(400).json({ error: "ID de sessão inválido" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Sessão não encontrada" });
    return;
  }

  const deviceId = getDeviceId(req);
  const swap = session.swapRequest;

  if (!swap || swap.status !== "pending") {
    res.status(400).json({ error: "Nenhuma troca pendente" });
    return;
  }

  // Only the target can accept
  if (swap.targetDeviceId !== deviceId) {
    res.status(403).json({ error: "Apenas a pessoa solicitada pode aceitar a troca" });
    return;
  }

  const queue: QueueEntry[] = (session.queue as QueueEntry[]) ?? [];
  const { requesterIndex, targetIndex } = swap;

  if (requesterIndex >= queue.length || targetIndex >= queue.length) {
    res.status(400).json({ error: "Fila mudou desde que a troca foi solicitada" });
    return;
  }

  // Swap positions in the queue
  const newQueue = [...queue];
  const temp = newQueue[requesterIndex];
  newQueue[requesterIndex] = newQueue[targetIndex];
  newQueue[targetIndex] = temp;

  await db
    .update(sessionsTable)
    .set({ queue: newQueue, swapRequest: null, updatedAt: new Date() })
    .where(eq(sessionsTable.id, id));

  res.json({ queue: newQueue, swapped: true });
});

router.post("/sessions/:id/swap/decline", async (req: ExpressReq, res): Promise<void> => {
  const id = String(req.params.id ?? "").toUpperCase();

  if (!id || id.length !== 6) {
    res.status(400).json({ error: "ID de sessão inválido" });
    return;
  }

  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, id));
  if (!session) {
    res.status(404).json({ error: "Sessão não encontrada" });
    return;
  }

  const deviceId = getDeviceId(req);
  const swap = session.swapRequest;

  if (!swap || swap.status !== "pending") {
    res.status(400).json({ error: "Nenhuma troca pendente" });
    return;
  }

  // Target or requester can cancel/decline
  if (swap.targetDeviceId !== deviceId && swap.requesterDeviceId !== deviceId) {
    res.status(403).json({ error: "Você não tem permissão para recusar esta troca" });
    return;
  }

  await db
    .update(sessionsTable)
    .set({ swapRequest: null, updatedAt: new Date() })
    .where(eq(sessionsTable.id, id));

  res.json({ declined: true });
});

export default router;
