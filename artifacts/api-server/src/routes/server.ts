import { Router } from "express";
import { db } from "@workspace/db";
import { leaderboardTable, announcementsTable } from "@workspace/db";
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

router.get("/leaderboard", async (req, res) => {
  try {
    const entries = await db.select().from(leaderboardTable).orderBy(desc(leaderboardTable.hearts)).limit(20);
    const ranked = entries.map((e, i) => ({
      rank: i + 1,
      userId: e.userId,
      username: e.username,
      minecraftUsername: e.minecraftUsername,
      hearts: e.hearts,
      kills: e.kills,
      owoBalance: e.owoBalance,
      activeRank: e.activeRank,
      avatarUrl: e.avatarUrl,
    }));
    res.json(ranked);
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
