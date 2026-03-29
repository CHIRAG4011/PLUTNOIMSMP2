import { Router } from "express";
import {
  User, StoreItem, Purchase, Ticket,
  Announcement, Coupon, Leaderboard,
} from "@workspace/db";
import { requireAdmin, AuthRequest } from "../lib/auth.js";
import { generateId } from "../lib/id.js";

const router = Router();
router.use(requireAdmin);

const TIER_ORDER: Record<string, number> = {
  HT1: 1, HT2: 2, HT3: 3, HT4: 4, HT5: 5,
  LT1: 6, LT2: 7, LT3: 8, LT4: 9, LT5: 10,
};

router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalPurchases,
      openTickets,
      bannedUsers,
      newUsersToday,
      activeRanks,
      revenueResult,
      revenueTodayResult,
    ] = await Promise.all([
      User.countDocuments(),
      Purchase.countDocuments(),
      Ticket.countDocuments({ status: "open" }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ activeRank: { $ne: null } }),
      Purchase.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$pricePaid" } } },
      ]),
      Purchase.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: "$pricePaid" } } },
      ]),
    ]);

    res.json({
      totalUsers,
      totalRevenue: revenueResult[0]?.total || 0,
      totalPurchases,
      openTickets,
      activeRanks,
      bannedUsers,
      newUsersToday,
      revenueToday: revenueTodayResult[0]?.total || 0,
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
    const skip = (page - 1) * limit;

    const query: any = search
      ? { $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    const safeUsers = users.map((u) => {
      const obj = u.toJSON() as any;
      delete obj.passwordHash;
      return obj;
    });
    res.json({ users: safeUsers, total, page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:id/ban", async (req, res) => {
  try {
    const { reason } = req.body;
    await User.updateOne(
      { _id: req.params.id },
      { isBanned: true, banReason: reason || "No reason provided" }
    );
    res.json({ message: "User banned" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:id/unban", async (req, res) => {
  try {
    await User.updateOne({ _id: req.params.id }, { isBanned: false, banReason: null });
    res.json({ message: "User unbanned" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:id/role", async (req: AuthRequest, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["user", "moderator", "admin"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: "Invalid role. Must be: user, moderator, or admin" });
      return;
    }
    const target = await User.findOne({ _id: req.params.id });
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
    await User.updateOne({ _id: req.params.id }, { role, updatedAt: new Date() });
    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/store/items", async (req, res) => {
  try {
    const { name, description, category, price, currency, imageUrl, images, features, isActive, isFeatured, badge, badgeColor, sortOrder } = req.body;
    const item = await StoreItem.create({
      _id: generateId(),
      name, description, category,
      price: Number(price),
      currency: currency || "usd",
      imageUrl: imageUrl || null,
      images: images || [],
      features: features || [],
      isActive: isActive !== false,
      isFeatured: isFeatured || false,
      badge: badge || null,
      badgeColor: badgeColor || null,
      sortOrder: Number(sortOrder) || 0,
    });
    res.json(item.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/store/items/:id", async (req, res) => {
  try {
    const { name, description, category, price, currency, imageUrl, images, features, isActive, isFeatured, badge, badgeColor, sortOrder } = req.body;
    const item = await StoreItem.findOneAndUpdate(
      { _id: req.params.id },
      {
        name, description, category,
        price: Number(price),
        currency: currency || "usd",
        imageUrl: imageUrl || null,
        images: images || [],
        features: features || [],
        isActive: isActive !== false,
        isFeatured: isFeatured || false,
        badge: badge || null,
        badgeColor: badgeColor || null,
        sortOrder: Number(sortOrder) || 0,
        updatedAt: new Date(),
      },
      { new: true }
    );
    res.json(item?.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/store/items/:id", async (req, res) => {
  try {
    await StoreItem.deleteOne({ _id: req.params.id });
    res.json({ message: "Item deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tickets", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ updatedAt: -1 });
    res.json(tickets.map((t) => t.toJSON()));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/purchases", async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 });
    res.json(purchases.map((p) => p.toJSON()));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/announcements", async (req, res) => {
  try {
    const items = await Announcement.find().sort({ createdAt: -1 });
    res.json(items.map((a) => a.toJSON()));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/announcements", async (req: AuthRequest, res) => {
  try {
    const { title, content, type } = req.body;
    const item = await Announcement.create({
      _id: generateId(),
      title, content,
      type: type || "info",
      isActive: true,
      authorId: req.user?.id || null,
      authorName: req.user?.username || null,
    });
    res.json(item.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/coupons", async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons.map((c) => c.toJSON()));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/coupons", async (req, res) => {
  try {
    const { code, discountPercent, usageLimit, expiresAt } = req.body;
    const coupon = await Coupon.create({
      _id: generateId(),
      code,
      discountPercent: Number(discountPercent),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: true,
    });
    res.json(coupon.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/currency/adjust", async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    const user = await User.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const newBalance = Math.max(0, user.owoBalance + Number(amount));
    await User.updateOne({ _id: userId }, { owoBalance: newBalance });
    res.json({ message: `Currency adjusted. New balance: ${newBalance} OWO. Reason: ${reason || "N/A"}` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/roles", (_req, res) => {
  res.json([
    { id: "1", name: "owner", permissions: ["*"], color: "#FF6B6B", createdAt: new Date().toISOString() },
    { id: "2", name: "admin", permissions: ["manage_users", "manage_store", "manage_tickets", "manage_announcements"], color: "#4ADE80", createdAt: new Date().toISOString() },
    { id: "3", name: "moderator", permissions: ["manage_tickets", "view_users"], color: "#60A5FA", createdAt: new Date().toISOString() },
    { id: "4", name: "user", permissions: ["purchase", "tickets", "leaderboard"], color: "#9CA3AF", createdAt: new Date().toISOString() },
  ]);
});

router.get("/leaderboard", async (req, res) => {
  try {
    const entries = await Leaderboard.find().limit(200);
    const sorted = entries
      .map((e) => e.toJSON())
      .sort((a, b) => {
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
    const updates: any = { updatedAt: new Date() };
    if (tier !== undefined) updates.tier = tier;
    if (kills !== undefined) updates.kills = Number(kills);
    if (activeRank !== undefined) updates.activeRank = activeRank || null;
    if (minecraftUsername !== undefined) updates.minecraftUsername = minecraftUsername || null;

    const updated = await Leaderboard.findOneAndUpdate(
      { userId: req.params.userId },
      updates,
      { new: true }
    );
    if (!updated) {
      res.status(404).json({ error: "Player not found in leaderboard" });
      return;
    }

    if (activeRank !== undefined) {
      await User.updateOne({ _id: req.params.userId }, { activeRank: activeRank || null });
    }
    if (minecraftUsername !== undefined) {
      await User.updateOne({ _id: req.params.userId }, { minecraftUsername: minecraftUsername || null });
    }

    res.json(updated.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/leaderboard/sync", async (req, res) => {
  try {
    const users = await User.find();
    let added = 0;
    for (const user of users) {
      const result = await Leaderboard.updateOne(
        { userId: user.id },
        {
          $setOnInsert: {
            _id: generateId(),
            userId: user.id,
            username: user.username,
            minecraftUsername: user.minecraftUsername || null,
            avatarUrl: user.avatarUrl || user.discordAvatar || null,
            activeRank: user.activeRank || null,
            tier: "LT5",
            kills: 0,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
      if (result.upsertedCount > 0) added++;
    }
    res.json({ message: `Synced ${added} users to leaderboard` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
