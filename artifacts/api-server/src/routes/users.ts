import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, karaokeUsersTable } from "@workspace/db";
import { RevokeUserAccessParams } from "@workspace/api-zod";

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
      woocommerceCustomerId: u.woocommerceCustomerId,
      subscriptionStatus: u.subscriptionStatus,
      accessGranted: u.accessGranted,
      accessGrantedAt: u.accessGrantedAt?.toISOString() ?? null,
      expiresAt: u.expiresAt?.toISOString() ?? null,
    })),
  );
});

router.post("/users/login", async (req, res): Promise<void> => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!email || !email.includes("@")) {
    res.status(400).json({ error: "Email inválido" });
    return;
  }

  const [user] = await db
    .select()
    .from(karaokeUsersTable)
    .where(eq(karaokeUsersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "Email não encontrado. Verifique sua assinatura." });
    return;
  }

  if (!user.accessGranted) {
    res.status(403).json({ error: "Acesso revogado. Entre em contato com o suporte." });
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

router.post("/users/:id/revoke", async (req, res): Promise<void> => {
  const params = RevokeUserAccessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .update(karaokeUsersTable)
    .set({ accessGranted: false, subscriptionStatus: "cancelled" })
    .where(eq(karaokeUsersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "Utilizador não encontrado" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    woocommerceCustomerId: user.woocommerceCustomerId,
    subscriptionStatus: user.subscriptionStatus,
    accessGranted: user.accessGranted,
    accessGrantedAt: user.accessGrantedAt?.toISOString() ?? null,
    expiresAt: user.expiresAt?.toISOString() ?? null,
  });
});

export default router;
