import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, storeItemsTable, purchasesTable,
  ticketsTable, announcementsTable, couponsTable
} from "@workspace/db";
import { eq, desc, ilike, or, count, sql } from "drizzle-orm";
import { requireAdmin, AuthRequest } from "../lib/auth.js";
import { generateId } from "../lib/id.js";

const router = Router();
router.use(requireAdmin);

router.get("/stats", async (req, res) => {
  try {
    const [totalUsers] = await db.select({ count: count() }).from(usersTable);
    const [totalPurchases] = await db.select({ count: count() }).from(purchasesTable);
    const [openTickets] = await db.select({ count: count() }).from(ticketsTable).where(eq(ticketsTable.status, "open"));
    const [bannedUsers] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.isBanned, true));
    const revenueResult = await db.select({ total: sql<number>`coalesce(sum(price_paid), 0)` }).from(purchasesTable).where(eq(purchasesTable.status, "completed"));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [newUsersToday] = await db.select({ count: count() }).from(usersTable).where(sql`created_at >= ${today}`);
    const [revenueToday] = await db.select({ total: sql<number>`coalesce(sum(price_paid), 0)` }).from(purchasesTable).where(sql`created_at >= ${today}`);
    const [activeRanks] = await db.select({ count: count() }).from(usersTable).where(sql`active_rank is not null`);

    res.json({
      totalUsers: totalUsers.count,
      totalRevenue: Number(revenueResult[0].total),
      totalPurchases: totalPurchases.count,
      openTickets: openTickets.count,
      activeRanks: activeRanks.count,
      bannedUsers: bannedUsers.count,
      newUsersToday: newUsersToday.count,
      revenueToday: Number(revenueToday[0].total),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;
    const offset = (page - 1) * limit;

    let users;
    if (search) {
      users = await db.select().from(usersTable)
        .where(or(ilike(usersTable.username, `%${search}%`), ilike(usersTable.email, `%${search}%`)))
        .orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
    } else {
      users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
    }
    const [{ total }] = await db.select({ total: count() }).from(usersTable);
    const safeUsers = users.map(({ passwordHash: _, ...u }) => u);
    res.json({ users: safeUsers, total, page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:id/ban", async (req, res) => {
  try {
    const { reason } = req.body;
    await db.update(usersTable).set({ isBanned: true, banReason: reason || "No reason provided" }).where(eq(usersTable.id, req.params.id));
    res.json({ message: "User banned" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:id/unban", async (req, res) => {
  try {
    await db.update(usersTable).set({ isBanned: false, banReason: null }).where(eq(usersTable.id, req.params.id));
    res.json({ message: "User unbanned" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/store/items", async (req, res) => {
  try {
    const { name, description, category, price, currency, imageUrl, features, isActive, isFeatured, badge, badgeColor } = req.body;
    const id = generateId();
    const [item] = await db.insert(storeItemsTable).values({
      id, name, description,
      category: category as any,
      price: Number(price),
      currency: (currency as any) || "owo",
      imageUrl: imageUrl || null,
      features: features || [],
      isActive: isActive !== false,
      isFeatured: isFeatured || false,
      badge: badge || null,
      badgeColor: badgeColor || null,
    }).returning();
    res.json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/store/items/:id", async (req, res) => {
  try {
    const { name, description, category, price, currency, imageUrl, features, isActive, isFeatured, badge, badgeColor } = req.body;
    const [item] = await db.update(storeItemsTable).set({
      name, description,
      category: category as any,
      price: Number(price),
      currency: (currency as any) || "owo",
      imageUrl: imageUrl || null,
      features: features || [],
      isActive: isActive !== false,
      isFeatured: isFeatured || false,
      badge: badge || null,
      badgeColor: badgeColor || null,
      updatedAt: new Date(),
    }).where(eq(storeItemsTable.id, req.params.id)).returning();
    res.json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/store/items/:id", async (req, res) => {
  try {
    await db.delete(storeItemsTable).where(eq(storeItemsTable.id, req.params.id));
    res.json({ message: "Item deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tickets", async (req, res) => {
  try {
    const tickets = await db.select().from(ticketsTable).orderBy(desc(ticketsTable.updatedAt));
    res.json(tickets);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/purchases", async (req, res) => {
  try {
    const purchases = await db.select().from(purchasesTable).orderBy(desc(purchasesTable.createdAt));
    res.json(purchases);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/announcements", async (req, res) => {
  try {
    const items = await db.select().from(announcementsTable).orderBy(desc(announcementsTable.createdAt));
    res.json(items);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/announcements", async (req: AuthRequest, res) => {
  try {
    const { title, content, type } = req.body;
    const id = generateId();
    const [item] = await db.insert(announcementsTable).values({
      id, title, content,
      type: (type as any) || "info",
      isActive: true,
      authorId: req.user?.id,
      authorName: req.user?.username,
    }).returning();
    res.json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/coupons", async (req, res) => {
  try {
    const coupons = await db.select().from(couponsTable).orderBy(desc(couponsTable.createdAt));
    res.json(coupons);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/coupons", async (req, res) => {
  try {
    const { code, discountPercent, usageLimit, expiresAt } = req.body;
    const id = generateId();
    const [coupon] = await db.insert(couponsTable).values({
      id, code,
      discountPercent: Number(discountPercent),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
    }).returning();
    res.json(coupon);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/currency/adjust", async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const newBalance = Math.max(0, user.owoBalance + Number(amount));
    await db.update(usersTable).set({ owoBalance: newBalance }).where(eq(usersTable.id, userId));
    res.json({ message: `Currency adjusted. New balance: ${newBalance} OWO. Reason: ${reason || "N/A"}` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/roles", async (_req, res) => {
  res.json([
    { id: "1", name: "owner", permissions: ["*"], color: "#FF6B6B", createdAt: new Date().toISOString() },
    { id: "2", name: "admin", permissions: ["manage_users", "manage_store", "manage_tickets", "manage_announcements"], color: "#4ADE80", createdAt: new Date().toISOString() },
    { id: "3", name: "moderator", permissions: ["manage_tickets", "view_users"], color: "#60A5FA", createdAt: new Date().toISOString() },
    { id: "4", name: "user", permissions: ["purchase", "tickets", "leaderboard"], color: "#9CA3AF", createdAt: new Date().toISOString() },
  ]);
});

export default router;
