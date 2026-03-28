import { Router } from "express";
import { db } from "@workspace/db";
import { storeItemsTable, purchasesTable, usersTable, couponsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth.js";
import { generateId } from "../lib/id.js";

const router = Router();

router.get("/items", async (req, res) => {
  try {
    const { category } = req.query;
    let items;
    if (category && typeof category === "string" && category !== "all") {
      items = await db.select().from(storeItemsTable).where(
        and(eq(storeItemsTable.isActive, true), eq(storeItemsTable.category, category as any))
      );
    } else {
      items = await db.select().from(storeItemsTable).where(eq(storeItemsTable.isActive, true));
    }
    items.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    res.json(items);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/items/:id", async (req, res) => {
  try {
    const [item] = await db.select().from(storeItemsTable).where(eq(storeItemsTable.id, req.params.id)).limit(1);
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/purchase", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { itemId, couponCode } = req.body;
    if (!itemId) {
      res.status(400).json({ error: "Item ID required" });
      return;
    }
    const [item] = await db.select().from(storeItemsTable).where(and(eq(storeItemsTable.id, itemId), eq(storeItemsTable.isActive, true))).limit(1);
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    let finalPrice = item.price;
    let couponUsed: string | null = null;

    if (couponCode) {
      const [coupon] = await db.select().from(couponsTable).where(and(eq(couponsTable.code, couponCode), eq(couponsTable.isActive, true))).limit(1);
      if (coupon) {
        if (!coupon.expiresAt || coupon.expiresAt > new Date()) {
          if (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit) {
            finalPrice = Math.floor(finalPrice * (1 - coupon.discountPercent / 100));
            couponUsed = couponCode;
            await db.update(couponsTable).set({ usageCount: coupon.usageCount + 1 }).where(eq(couponsTable.id, coupon.id));
          }
        }
      }
    }

    if (item.currency === "owo") {
      if (user.owoBalance < finalPrice) {
        res.status(400).json({ error: "Insufficient OWO balance" });
        return;
      }
      await db.update(usersTable).set({ owoBalance: user.owoBalance - finalPrice }).where(eq(usersTable.id, user.id));
    }

    if (item.category === "ranks") {
      await db.update(usersTable).set({ activeRank: item.name }).where(eq(usersTable.id, user.id));
    }

    const id = generateId();
    const [purchase] = await db.insert(purchasesTable).values({
      id,
      userId: user.id,
      itemId: item.id,
      itemName: item.name,
      itemCategory: item.category,
      pricePaid: finalPrice,
      currency: item.currency,
      couponUsed,
      status: "completed",
    }).returning();
    res.json(purchase);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
