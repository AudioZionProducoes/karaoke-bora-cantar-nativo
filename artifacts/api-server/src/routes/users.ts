import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, karaokeUsersTable } from "@workspace/db";
import { RevokeUserAccessParams } from "@workspace/api-zod";
import bcryptjs from "bcryptjs";
import { randomBytes } from "crypto";

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function generateTempPassword(): string {
  // 8-digit numeric password for easy typing on TV/mobile
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

async function hashPassword(plain: string): Promise<string> {
  return bcryptjs.hash(plain, 10);
}

async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(plain, hash);
}

const router: IRouter = Router();

router.get("/users", async (_req, res): Promise<void> => {
  const users = await db
    .select()
    .from(karaokeUsersTable)
    .orderBy(karaokeUsersTable.id);

  res.json(
    users.map((u) => ({
      id: u.id,
      email: u.email,
      subscriptionStatus: u.subscriptionStatus,
      accessGranted: u.accessGranted,
      accessGrantedAt: u.accessGrantedAt?.toISOString() ?? null,
      expiresAt: u.expiresAt?.toISOString() ?? null,
      hasPassword: !!u.passwordHash,
      hasActiveSession: !!u.activeSessionToken,
    })),
  );
});

router.post("/users/login", async (req, res): Promise<void> => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";

  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Email inválido" });
    return;
  }
  if (!password) {
    res.status(400).json({ error: "Senha é obrigatória" });
    return;
  }

  const [user] = await db
    .select()
    .from(karaokeUsersTable)
    .where(eq(karaokeUsersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "Email ou senha incorretos." });
    return;
  }

  if (!user.accessGranted) {
    res.status(403).json({ error: "Acesso revogado. Entre em contato com o suporte." });
    return;
  }

  if (!user.passwordHash) {
    res.status(403).json({ error: "Conta sem senha configurada. Entre em contato com o suporte." });
    return;
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Email ou senha incorretos." });
    return;
  }

  // Single active session: generate new token, overwrite old one
  const token = generateToken();
  const now = new Date();

  await db
    .update(karaokeUsersTable)
    .set({ activeSessionToken: token, activeSessionAt: now })
    .where(eq(karaokeUsersTable.id, user.id));

  req.log?.info({ email, userId: user.id }, "User logged in, session token rotated");

  res.json({
    token,
    id: user.id,
    email: user.email,
    subscriptionStatus: user.subscriptionStatus,
    accessGranted: user.accessGranted,
    accessGrantedAt: user.accessGrantedAt?.toISOString() ?? null,
    expiresAt: user.expiresAt?.toISOString() ?? null,
  });
});

router.post("/users/logout", async (req, res): Promise<void> => {
  const token = typeof req.headers["x-auth-token"] === "string" ? req.headers["x-auth-token"] : "";

  if (!token) {
    res.json({ success: true, message: "Already logged out" });
    return;
  }

  // Find user by token and clear it
  const [user] = await db
    .select()
    .from(karaokeUsersTable)
    .where(eq(karaokeUsersTable.activeSessionToken, token));

  if (user) {
    await db
      .update(karaokeUsersTable)
      .set({ activeSessionToken: null, activeSessionAt: null })
      .where(eq(karaokeUsersTable.id, user.id));
  }

  res.json({ success: true });
});

router.get("/users/me", async (req, res): Promise<void> => {
  const token = typeof req.headers["x-auth-token"] === "string" ? req.headers["x-auth-token"] : "";

  if (!token) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const [user] = await db
    .select()
    .from(karaokeUsersTable)
    .where(eq(karaokeUsersTable.activeSessionToken, token));

  if (!user) {
    res.status(401).json({ error: "Sessão inválida ou expirada. Faça login novamente." });
    return;
  }

  if (!user.accessGranted) {
    res.status(403).json({ error: "Acesso revogado." });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    subscriptionStatus: user.subscriptionStatus,
    accessGranted: user.accessGranted,
    accessGrantedAt: user.accessGrantedAt?.toISOString() ?? null,
    expiresAt: user.expiresAt?.toISOString() ?? null,
  });
});

// Admin: generate temporary password for a subscriber
router.post("/users/:id/generate-password", async (req, res): Promise<void> => {
  const params = RevokeUserAccessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(karaokeUsersTable)
    .where(eq(karaokeUsersTable.id, params.data.id));

  if (!user) {
    res.status(404).json({ error: "Utilizador não encontrado" });
    return;
  }

  const tempPassword = generateTempPassword();
  const hash = await hashPassword(tempPassword);

  await db
    .update(karaokeUsersTable)
    .set({ passwordHash: hash })
    .where(eq(karaokeUsersTable.id, user.id));

  req.log?.info({ userId: user.id, email: user.email }, "Temporary password generated");

  res.json({
    id: user.id,
    email: user.email,
    temporaryPassword: tempPassword,
    message: `Senha temporária gerada. Compartilhe com o assinante.`,
  });
});

router.post("/users/:id/revoke", async (req, res): Promise<void> => {
  const params = RevokeUserAccessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .update(karaokeUsersTable)
    .set({ accessGranted: false, subscriptionStatus: "cancelled", activeSessionToken: null, activeSessionAt: null })
    .where(eq(karaokeUsersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "Utilizador não encontrado" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    subscriptionStatus: user.subscriptionStatus,
    accessGranted: user.accessGranted,
    accessGrantedAt: user.accessGrantedAt?.toISOString() ?? null,
    expiresAt: user.expiresAt?.toISOString() ?? null,
  });
});

export default router;
