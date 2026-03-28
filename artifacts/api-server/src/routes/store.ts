import { Router } from "express";
import { db } from "@workspace/db";
import { storeItemsTable, purchasesTable, usersTable, couponsTable, otpsTable } from "@workspace/db";
import { eq, and, inArray, gt } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth.js";
import { generateId } from "../lib/id.js";
import { sendOrderConfirmationEmail, sendCheckoutOtpEmail } from "../lib/email.js";

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
      currency: "usd",
      couponUsed,
      status: "pending",
    }).returning();
    res.json(purchase);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/checkout/send-otp", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.delete(otpsTable).where(and(eq(otpsTable.email, user.email), eq(otpsTable.purpose, "checkout")));
    await db.insert(otpsTable).values({
      id: generateId(),
      email: user.email,
      code,
      purpose: "checkout",
      expiresAt,
    });

    await sendCheckoutOtpEmail(user.email, user.username, code);
    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

router.post("/checkout", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { items, couponCode, otpCode } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }
    if (!otpCode) {
      res.status(400).json({ error: "OTP verification required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [otp] = await db.select().from(otpsTable).where(
      and(
        eq(otpsTable.email, user.email),
        eq(otpsTable.code, otpCode),
        eq(otpsTable.purpose, "checkout"),
        gt(otpsTable.expiresAt, new Date()),
      )
    ).limit(1);

    if (!otp) {
      res.status(400).json({ error: "Invalid or expired OTP code" });
      return;
    }

    await db.delete(otpsTable).where(eq(otpsTable.id, otp.id));

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

    let totalUsd = 0;
    const orderItems: { name: string; price: number; quantity: number }[] = [];

    for (const cartItem of items as { itemId: string; quantity: number }[]) {
      const storeItem = storeItems.find(i => i.id === cartItem.itemId);
      if (!storeItem) continue;
      const qty = Math.max(1, cartItem.quantity || 1);
      let unitPrice = storeItem.price;
      if (discountPercent > 0) unitPrice = Math.floor(unitPrice * (1 - discountPercent / 100));
      totalUsd += unitPrice * qty;

      orderItems.push({ name: storeItem.name, price: unitPrice, quantity: qty });

      for (let q = 0; q < qty; q++) {
        await db.insert(purchasesTable).values({
          id: generateId(),
          userId: user.id,
          itemId: storeItem.id,
          itemName: storeItem.name,
          itemCategory: storeItem.category,
          pricePaid: unitPrice,
          currency: "usd",
          couponUsed: couponCode || null,
          status: "pending",
        });
      }
    }

    sendOrderConfirmationEmail(user.email, user.username, orderItems, totalUsd, couponCode ? discountPercent : 0).catch(() => {});

    res.json({ message: "Order placed successfully! Check your email for confirmation. Your order is pending review." });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
