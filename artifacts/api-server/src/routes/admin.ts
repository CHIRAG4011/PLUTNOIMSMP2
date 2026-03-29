import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, storeItemsTable, purchasesTable,
  ticketsTable, announcementsTable, couponsTable, leaderboardTable
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
      revenueToday: Number(revenueToday.total),
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
    const { name, description, category, price, currency, imageUrl, images, features, isActive, isFeatured, badge, badgeColor, sortOrder } = req.body;
    const id = generateId();
    const [item] = await db.insert(storeItemsTable).values({
      id, name, description,
      category: category as any,
      price: Number(price),
      currency: (currency as any) || "usd",
      imageUrl: imageUrl || null,
      images: images || [],
      features: features || [],
      isActive: isActive !== false,
      isFeatured: isFeatured || false,
      badge: badge || null,
      badgeColor: badgeColor || null,
      sortOrder: Number(sortOrder) || 0,
    }).returning();
    res.json(item);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/store/items/:id", async (req, res) => {
  try {
    const { name, description, category, price, currency, imageUrl, images, features, isActive, isFeatured, badge, badgeColor, sortOrder } = req.body;
    const [item] = await db.update(storeItemsTable).set({
      name, description,
      category: category as any,
      price: Number(price),
      currency: (currency as any) || "usd",
      imageUrl: imageUrl || null,
      images: images || [],
      features: features || [],
      isActive: isActive !== false,
      isFeatured: isFeatured || false,
      badge: badge || null,
      badgeColor: badgeColor || null,
      sortOrder: Number(sortOrder) || 0,
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

router.post("/users/:id/role", async (req: AuthRequest, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["user", "moderator", "admin"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: "Invalid role. Must be: user, moderator, or admin" });
      return;
    }
    const [target] = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id)).limit(1);
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (target.role === "owner") {
      res.status(403).json({ error: "Cannot change role of owner account" });
      return;
    }
    if (req.user?.role !== "owner" && role === "admin") {
      res.status(403).json({ error: "Only owners can promote users to admin" });
      return;
    }
    await db.update(usersTable).set({ role: role as any, updatedAt: new Date() }).where(eq(usersTable.id, req.params.id));
    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const TIER_ORDER: Record<string, number> = { HT1: 1, HT2: 2, HT3: 3, HT4: 4, HT5: 5, LT1: 6, LT2: 7, LT3: 8, LT4: 9, LT5: 10 };

router.get("/leaderboard", async (req, res) => {
  try {
    const entries = await db.select().from(leaderboardTable).limit(200);
    const sorted = entries.sort((a, b) => {
      const ta = TIER_ORDER[a.tier] ?? 99;
      const tb = TIER_ORDER[b.tier] ?? 99;
      if (ta !== tb) return ta - tb;
      return b.kills - a.kills;
    });
    const ranked = sorted.map((e, i) => ({ ...e, rank: i + 1 }));
    res.json(ranked);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/leaderboard/:userId", async (req, res) => {
  try {
    const { tier, kills, activeRank, minecraftUsername } = req.body;
    const [entry] = await db.select().from(leaderboardTable).where(eq(leaderboardTable.userId, req.params.userId)).limit(1);
    if (!entry) {
      res.status(404).json({ error: "Player not found in leaderboard" });
      return;
    }
    const updates: any = { updatedAt: new Date() };
    if (tier !== undefined) updates.tier = tier;
    if (kills !== undefined) updates.kills = Number(kills);
    if (activeRank !== undefined) updates.activeRank = activeRank || null;
    if (minecraftUsername !== undefined) updates.minecraftUsername = minecraftUsername || null;

    const [updated] = await db.update(leaderboardTable).set(updates).where(eq(leaderboardTable.userId, req.params.userId)).returning();

    if (activeRank !== undefined) {
      await db.update(usersTable).set({ activeRank: activeRank || null }).where(eq(usersTable.id, req.params.userId));
    }
    if (minecraftUsername !== undefined) {
      await db.update(usersTable).set({ minecraftUsername: minecraftUsername || null }).where(eq(usersTable.id, req.params.userId));
    }

    res.json(updated);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/leaderboard/sync", async (req, res) => {
  try {
    const users = await db.select().from(usersTable);
    let added = 0;
    for (const user of users) {
      const existing = await db.select().from(leaderboardTable).where(eq(leaderboardTable.userId, user.id)).limit(1);
      if (existing.length === 0) {
        await db.insert(leaderboardTable).values({
          id: generateId(),
          userId: user.id,
          username: user.username,
          minecraftUsername: user.minecraftUsername || null,
          avatarUrl: user.avatarUrl || user.discordAvatar || null,
          activeRank: user.activeRank || null,
          tier: "LT5",
          kills: 0,
        }).onConflictDoNothing();
        added++;
      }
    }
    res.json({ message: `Synced ${added} users to leaderboard` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
