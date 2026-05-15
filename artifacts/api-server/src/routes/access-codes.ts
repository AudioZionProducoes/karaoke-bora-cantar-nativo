import { Router, type IRouter } from "express";
import { eq, and, gt, isNull } from "drizzle-orm";
import { db, accessCodesTable } from "@workspace/db";
import { randomBytes } from "crypto";

function generateCode(): string {
  // 8-character alphanumeric code, easy to type on TV
  return randomBytes(4).toString("hex").toUpperCase();
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

const router: IRouter = Router();

// POST /access-codes — generate new code(s) (admin only)
router.post("/access-codes", async (req, res): Promise<void> => {
  const { durationMinutes, quantity, label } = req.body ?? {};

  if (!durationMinutes || typeof durationMinutes !== "number" || durationMinutes <= 0) {
    res.status(400).json({ error: "durationMinutes inválido" });
    return;
  }

  const qty = typeof quantity === "number" && quantity > 0 ? Math.min(quantity, 50) : 1;
  const createdBy = req.body?.createdBy ?? null;

  const results: { code: string; durationMinutes: number; label: string | null; expiresAt: string | null }[] = [];

  for (let i = 0; i < qty; i++) {
    let code: string;
    let unique = false;
    let attempts = 0;

    do {
      code = generateCode();
      const existing = await db
        .select({ id: accessCodesTable.id })
        .from(accessCodesTable)
        .where(eq(accessCodesTable.code, code));
      unique = existing.length === 0;
      attempts++;
    } while (!unique && attempts < 10);

    if (!unique) {
      res.status(500).json({ error: "Não foi possível gerar um código único" });
      return;
    }

    const [record] = await db
      .insert(accessCodesTable)
      .values({
        code,
        durationMinutes,
        label: typeof label === "string" && label.trim() ? label.trim() : null,
        createdBy,
      })
      .returning();

    results.push({
      code: record.code,
      durationMinutes: record.durationMinutes,
      label: record.label,
      expiresAt: null,
    });
  }

  req.log?.info({ count: results.length, durations: results.map(r => r.durationMinutes) }, "Access codes generated");

  res.status(201).json({
    success: true,
    codes: results,
  });
});

// GET /access-codes — list all codes (admin only)
router.get("/access-codes", async (_req, res): Promise<void> => {
  const codes = await db
    .select()
    .from(accessCodesTable)
    .orderBy(accessCodesTable.id);

  const now = new Date();

  res.json(
    codes.map((c) => {
      let remainingMinutes: number | null = null;
      if (c.used && c.usedAt) {
        const expiresAt = addMinutes(c.usedAt, c.durationMinutes);
        const msRemaining = expiresAt.getTime() - now.getTime();
        remainingMinutes = msRemaining > 0 ? Math.ceil(msRemaining / 60_000) : 0;
      }

      return {
        id: c.id,
        code: c.code,
        durationMinutes: c.durationMinutes,
        label: c.label,
        used: c.used,
        usedAt: c.usedAt?.toISOString() ?? null,
        usedBy: c.usedBy,
        redeemerName: c.redeemerName,
        redeemerEmail: c.redeemerEmail,
        redeemerWhatsapp: c.redeemerWhatsapp,
        expiresAt: c.expiresAt?.toISOString() ?? null,
        createdAt: c.createdAt?.toISOString() ?? null,
        createdBy: c.createdBy,
        status: c.used
          ? c.expiresAt && c.expiresAt < now
            ? "expired"
            : "used"
          : "pending",
        remainingMinutes,
      };
    }),
  );
});

// POST /access-codes/:code/redeem — redeem a code (public)
router.post("/access-codes/:code/redeem", async (req, res): Promise<void> => {
  const rawCode = typeof req.params.code === "string" ? req.params.code.trim().toUpperCase() : "";

  if (!rawCode) {
    res.status(400).json({ error: "Código obrigatório" });
    return;
  }

  const [code] = await db
    .select()
    .from(accessCodesTable)
    .where(eq(accessCodesTable.code, rawCode));

  if (!code) {
    res.status(404).json({ error: "Código não encontrado" });
    return;
  }

  if (code.used) {
    res.status(409).json({ error: "Código já utilizado" });
    return;
  }

  const now = new Date();
  const usedBy = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : null;
  const redeemerName = typeof req.body?.name === "string" ? req.body.name.trim() : null;
  const redeemerEmail = usedBy;
  const redeemerWhatsapp = typeof req.body?.whatsapp === "string" ? req.body.whatsapp.trim() : null;
  const accessExpiresAt = addMinutes(now, code.durationMinutes);

  await db
    .update(accessCodesTable)
    .set({
      used: true,
      usedAt: now,
      usedBy,
      redeemerName,
      redeemerEmail,
      redeemerWhatsapp,
      expiresAt: accessExpiresAt,
    })
    .where(eq(accessCodesTable.id, code.id));

  req.log?.info({ code: rawCode, duration: code.durationMinutes, usedBy }, "Access code redeemed");

  res.json({
    success: true,
    message: `Acesso liberado por ${code.durationMinutes} minutos!`,
    durationMinutes: code.durationMinutes,
    accessExpiresAt: accessExpiresAt.toISOString(),
  });
});

// GET /access-codes/validate — check if a temporary access is still valid (public)
router.get("/access-codes/validate", async (req, res): Promise<void> => {
  const rawCode = typeof req.query.code === "string" ? req.query.code.trim().toUpperCase() : "";

  if (!rawCode) {
    res.status(400).json({ error: "Código obrigatório" });
    return;
  }

  const [code] = await db
    .select()
    .from(accessCodesTable)
    .where(eq(accessCodesTable.code, rawCode));

  if (!code) {
    res.status(404).json({ valid: false, error: "Código não encontrado" });
    return;
  }

  const now = new Date();

  if (!code.used) {
    res.json({ valid: false, error: "Código ainda não foi resgatado" });
    return;
  }

  const accessExpiresAt = code.usedAt ? addMinutes(code.usedAt, code.durationMinutes) : null;

  if (!accessExpiresAt || accessExpiresAt < now) {
    res.json({ valid: false, error: "Acesso expirado" });
    return;
  }

  const remainingMinutes = Math.max(0, Math.ceil((accessExpiresAt.getTime() - now.getTime()) / 60_000));

  res.json({
    valid: true,
    durationMinutes: code.durationMinutes,
    remainingMinutes,
    accessExpiresAt: accessExpiresAt.toISOString(),
  });
});

export default router;
