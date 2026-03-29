import { Router } from "express";
import { db } from "@workspace/db";
import { leaderboardTable, announcementsTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/server/status", async (_req, res) => {
  res.json({
    online: true,
    players: Math.floor(Math.random() * 50) + 5,
    maxPlayers: 100,
    version: "1.21.1",
    ip: "play.plutoniumsmp.net",
    uptime: "99.9%",
    tps: 19.8,
  });
});

const TIER_ORDER: Record<string, number> = { HT1: 1, HT2: 2, HT3: 3, HT4: 4, HT5: 5, LT1: 6, LT2: 7, LT3: 8, LT4: 9, LT5: 10 };

router.get("/leaderboard", async (req, res) => {
  try {
    const entries = await db.select().from(leaderboardTable).limit(100);
    const sorted = entries.sort((a, b) => {
      const ta = TIER_ORDER[a.tier] ?? 99;
      const tb = TIER_ORDER[b.tier] ?? 99;
      if (ta !== tb) return ta - tb;
      return b.kills - a.kills;
    });
    const ranked = sorted.map((e, i) => ({
      rank: i + 1,
      userId: e.userId,
      username: e.username,
      minecraftUsername: e.minecraftUsername,
      tier: e.tier,
      kills: e.kills,
      activeRank: e.activeRank,
      avatarUrl: e.avatarUrl,
    }));
    res.json(ranked);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/players/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const allEntries = await db.select().from(leaderboardTable).limit(200);
    const sorted = allEntries.sort((a, b) => {
      const ta = TIER_ORDER[a.tier] ?? 99;
      const tb = TIER_ORDER[b.tier] ?? 99;
      if (ta !== tb) return ta - tb;
      return b.kills - a.kills;
    });
    const entryIdx = sorted.findIndex(e => e.userId === userId);
    if (entryIdx === -1) {
      res.status(404).json({ error: "Player not found" });
      return;
    }
    const entry = sorted[entryIdx];
    const rank = entryIdx + 1;

    const [user] = await db.select({
      id: usersTable.id,
      username: usersTable.username,
      discordUsername: usersTable.discordUsername,
      discordAvatar: usersTable.discordAvatar,
      avatarUrl: usersTable.avatarUrl,
      minecraftUsername: usersTable.minecraftUsername,
      activeRank: usersTable.activeRank,
      createdAt: usersTable.createdAt,
      role: usersTable.role,
    }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    res.json({
      userId: entry.userId,
      username: entry.username,
      minecraftUsername: entry.minecraftUsername || user?.minecraftUsername || null,
      avatarUrl: entry.avatarUrl || user?.discordAvatar || null,
      tier: entry.tier,
      kills: entry.kills,
      rank,
      totalPlayers: sorted.length,
      activeRank: entry.activeRank || user?.activeRank || null,
      discordUsername: user?.discordUsername || null,
      joinedAt: user?.createdAt || null,
      role: user?.role || null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/announcements", async (req, res) => {
  try {
    const items = await db.select().from(announcementsTable)
      .where(eq(announcementsTable.isActive, true))
      .orderBy(desc(announcementsTable.createdAt))
      .limit(10);
    res.json(items);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
