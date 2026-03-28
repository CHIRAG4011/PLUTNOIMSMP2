import { Router } from "express";
import { db } from "@workspace/db";
import { purchasesTable } from "@workspace/db";
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

export default router;
