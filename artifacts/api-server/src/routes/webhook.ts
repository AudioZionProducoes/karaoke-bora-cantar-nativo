import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, karaokeUsersTable } from "@workspace/db";
import bcryptjs from "bcryptjs";
import { logger } from "../lib/logger";
import { sendWelcomeEmail } from "../lib/email";

function generateTempPassword(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

async function hashPassword(plain: string): Promise<string> {
  return bcryptjs.hash(plain, 10);
}

const router: IRouter = Router();

router.post("/webhook/woocommerce", async (req, res): Promise<void> => {
  const { event, customer_id, customer_email, subscription_status } = req.body as {
    event?: string;
    customer_id?: string;
    customer_email?: string;
    subscription_status?: string;
    order_id?: string;
  };

  if (!event) {
    res.status(400).json({ success: false, message: "Missing event field" });
    return;
  }

  req.log.info({ event, customer_email, subscription_status }, "WooCommerce webhook received");

  const email = customer_email?.toLowerCase().trim();

  if (!email) {
    res.json({ success: true, message: "No customer email; skipped" });
    return;
  }

  const isActive =
    event === "subscription_active" ||
    event === "order_completed" ||
    subscription_status === "active";

  const isCancelled =
    event === "subscription_cancelled" ||
    event === "subscription_expired" ||
    subscription_status === "cancelled" ||
    subscription_status === "expired";

  if (isActive) {
    const existing = await db
      .select()
      .from(karaokeUsersTable)
      .where(eq(karaokeUsersTable.email, email));

    if (existing.length > 0) {
      await db
        .update(karaokeUsersTable)
        .set({
          subscriptionStatus: "active",
          accessGranted: true,
          woocommerceCustomerId: customer_id ?? existing[0].woocommerceCustomerId,
        })
        .where(eq(karaokeUsersTable.email, email));

      req.log.info({ email }, "Subscription renewed — access restored");
      res.json({ success: true, message: `Access restored for ${email}` });
      return;
    }

    // New subscriber: generate temporary password
    const tempPassword = generateTempPassword();
    const hash = await hashPassword(tempPassword);

    await db.insert(karaokeUsersTable).values({
      email,
      passwordHash: hash,
      woocommerceCustomerId: customer_id ?? null,
      subscriptionStatus: "active",
      accessGranted: true,
    });

    // Send welcome email with temporary password
    try {
      await sendWelcomeEmail({ email, password: tempPassword });
    } catch (err) {
      req.log.warn({ email, error: (err as Error).message }, "Failed to send welcome email");
    }

    req.log.info({ email }, "New subscriber created with temporary password");
    res.json({
      success: true,
      message: `Subscriber created for ${email}`,
      temporaryPassword: tempPassword,
    });
    return;
  }

  if (isCancelled) {
    const status = subscription_status === "expired" ? "expired" : "cancelled";

    await db
      .update(karaokeUsersTable)
      .set({ subscriptionStatus: status, accessGranted: false, activeSessionToken: null, activeSessionAt: null })
      .where(eq(karaokeUsersTable.email, email));

    req.log.info({ email, status }, "Subscription cancelled — access revoked");
    res.json({ success: true, message: `Access revoked for ${email}` });
    return;
  }

  logger.info({ event }, "Unhandled WooCommerce event — ignoring");
  res.json({ success: true, message: `Event '${event}' received but not handled` });
});

export default router;
