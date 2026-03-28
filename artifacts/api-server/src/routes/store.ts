import { Router } from "express";
import { db } from "@workspace/db";
import { storeItemsTable, purchasesTable, usersTable, couponsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth.js";
import { generateId } from "../lib/id.js";
import { sendPaymentConfirmationEmail } from "../lib/email.js";

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

router.post("/checkout", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { items, discordUsername, couponCode } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const itemIds = items.map((i: any) => i.itemId);
    const storeItems = await db.select().from(storeItemsTable).where(
      and(inArray(storeItemsTable.id, itemIds), eq(storeItemsTable.isActive, true))
    );

    if (storeItems.length === 0) {
      res.status(400).json({ error: "No valid items found" });
      return;
    }

    let discountPercent = 0;
    if (couponCode) {
      const [coupon] = await db.select().from(couponsTable).where(
        and(eq(couponsTable.code, couponCode), eq(couponsTable.isActive, true))
      ).limit(1);
      if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date()) && (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit)) {
        discountPercent = coupon.discountPercent;
        await db.update(couponsTable).set({ usageCount: coupon.usageCount + 1 }).where(eq(couponsTable.id, coupon.id));
      }
    }

    let totalOwo = 0;
    const itemNames: string[] = [];

    for (const cartItem of items as { itemId: string; quantity: number }[]) {
      const storeItem = storeItems.find(i => i.id === cartItem.itemId);
      if (!storeItem) continue;
      const qty = Math.max(1, cartItem.quantity || 1);
      let price = storeItem.price * qty;
      if (discountPercent > 0) price = Math.floor(price * (1 - discountPercent / 100));
      if (storeItem.currency === "owo") totalOwo += price;

      for (let q = 0; q < qty; q++) {
        await db.insert(purchasesTable).values({
          id: generateId(),
          userId: user.id,
          itemId: storeItem.id,
          itemName: storeItem.name,
          itemCategory: storeItem.category,
          pricePaid: Math.floor(storeItem.price * (discountPercent > 0 ? (1 - discountPercent / 100) : 1)),
          currency: storeItem.currency,
          couponUsed: couponCode || null,
          status: "pending",
        });
        itemNames.push(qty > 1 ? `${storeItem.name} x${qty}` : storeItem.name);
      }
    }

    // Send confirmation email (fire-and-forget)
    sendPaymentConfirmationEmail(user.email, user.username, [...new Set(itemNames)], totalOwo).catch(() => {});

    res.json({ message: `Order placed! Go to our Discord and run \`owo pay PlutoniumSMP ${totalOwo}\` to complete payment.` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
