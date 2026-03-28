import { Router } from "express";
import { db } from "@workspace/db";
import { purchasesTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/purchases", requireAuth, async (req: AuthRequest, res) => {
  try {
    const purchases = await db.select().from(purchasesTable)
      .where(eq(purchasesTable.userId, req.user!.id))
      .orderBy(desc(purchasesTable.createdAt));
    res.json(purchases);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/me/profile-picture", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl) {
      res.status(400).json({ error: "avatarUrl is required" });
      return;
    }
    // Basic URL validation
    try {
      new URL(avatarUrl);
    } catch {
      res.status(400).json({ error: "Invalid URL" });
      return;
    }

    await db.update(usersTable)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(usersTable.id, req.user!.id));

    res.json({ message: "Profile picture updated" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
