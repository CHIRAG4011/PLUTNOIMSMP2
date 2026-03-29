import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, otpsTable, leaderboardTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { signToken, requireAuth, AuthRequest } from "../lib/auth.js";
import { generateId } from "../lib/id.js";
import { sendOtpEmail, sendWelcomeEmail, sendLoginNotificationEmail } from "../lib/email.js";

async function ensureLeaderboardEntry(userId: string, username: string, minecraftUsername?: string | null, avatarUrl?: string | null, activeRank?: string | null) {
  const existing = await db.select().from(leaderboardTable).where(eq(leaderboardTable.userId, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(leaderboardTable).values({
      id: generateId(),
      userId,
      username,
      minecraftUsername: minecraftUsername || null,
      avatarUrl: avatarUrl || null,
      activeRank: activeRank || null,
      tier: "LT5",
      kills: 0,
    }).onConflictDoNothing();
  }
}

const router = Router();

function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/send-otp", async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose) {
      res.status(400).json({ error: "Email and purpose are required" });
      return;
    }

    if (purpose === "registration") {
      const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (existing.length > 0) {
        res.status(400).json({ error: "Email already in use" });
        return;
      }
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.delete(otpsTable).where(
      and(eq(otpsTable.email, email), eq(otpsTable.purpose, purpose))
    );

    await db.insert(otpsTable).values({
      id: generateId(),
      email,
      code,
      purpose,
      expiresAt,
    });

    await sendOtpEmail(email, code, purpose);

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, code, purpose } = req.body;
    if (!email || !code || !purpose) {
      res.status(400).json({ error: "Email, code, and purpose are required" });
      return;
    }

    const [otp] = await db.select().from(otpsTable).where(
      and(
        eq(otpsTable.email, email),
        eq(otpsTable.code, code),
        eq(otpsTable.purpose, purpose),
        gt(otpsTable.expiresAt, new Date()),
      )
    ).limit(1);

    if (!otp) {
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }

    await db.update(otpsTable).set({ verified: true }).where(eq(otpsTable.id, otp.id));

    res.json({ message: "OTP verified" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, minecraftUsername, otpCode } = req.body;
    if (!username || !email || !password || !otpCode) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const [otp] = await db.select().from(otpsTable).where(
      and(
        eq(otpsTable.email, email),
        eq(otpsTable.code, otpCode),
        eq(otpsTable.purpose, "registration"),
        eq(otpsTable.verified, true),
        gt(otpsTable.expiresAt, new Date()),
      )
    ).limit(1);

    if (!otp) {
      res.status(400).json({ error: "Invalid or expired verification code. Please verify your email first." });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    const existingUsername = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (existingUsername.length > 0) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = generateId();
    const [user] = await db.insert(usersTable).values({
      id,
      username,
      email,
      passwordHash,
      minecraftUsername: minecraftUsername || null,
      role: "user",
      emailVerified: true,
    }).returning();

    await db.delete(otpsTable).where(eq(otpsTable.id, otp.id));

    await sendWelcomeEmail(email, username).catch(() => {});
    await ensureLeaderboardEntry(user.id, user.username, user.minecraftUsername).catch(() => {});

    const token = signToken({ id: user.id, username: user.username, role: user.role });
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Missing credentials" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.isBanned) {
      res.status(403).json({ error: `Account banned: ${user.banReason || "No reason provided"}` });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.delete(otpsTable).where(
      and(eq(otpsTable.email, email), eq(otpsTable.purpose, "login"))
    );
    await db.insert(otpsTable).values({
      id: generateId(),
      email,
      code,
      purpose: "login",
      expiresAt,
    });

    await sendOtpEmail(email, code, "login");

    res.json({ requiresOtp: true, message: "Verification code sent to your email" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login/verify", async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode) {
      res.status(400).json({ error: "Email and OTP code are required" });
      return;
    }

    const [otp] = await db.select().from(otpsTable).where(
      and(
        eq(otpsTable.email, email),
        eq(otpsTable.code, otpCode),
        eq(otpsTable.purpose, "login"),
        gt(otpsTable.expiresAt, new Date()),
      )
    ).limit(1);

    if (!otp) {
      res.status(400).json({ error: "Invalid or expired code" });
      return;
    }

    await db.delete(otpsTable).where(eq(otpsTable.id, otp.id));

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const token = signToken({ id: user.id, username: user.username, role: user.role });
    const { passwordHash: _, ...safeUser } = user;

    sendLoginNotificationEmail(email, user.username).catch(() => {});

    res.json({ user: safeUser, token });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out" });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";

function getBaseUrl(req: any): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  const replitDomain = process.env.REPLIT_DEV_DOMAIN || process.env.REPLIT_DOMAINS;
  if (replitDomain) return `https://${replitDomain.split(",")[0].trim()}`;
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  const host = req.get("host");
  const proto = req.get("x-forwarded-proto") || req.protocol || "https";
  return `${proto}://${host}`;
}

router.get("/discord", (req, res) => {
  if (!DISCORD_CLIENT_ID) {
    res.status(501).json({ error: "Discord OAuth not configured" });
    return;
  }
  const base = getBaseUrl(req);
  const redirectUri = `${base}/api/auth/discord/callback`;
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email",
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

router.get("/discord/callback", async (req, res) => {
  const base = getBaseUrl(req);
  const redirectUri = `${base}/api/auth/discord/callback`;
  const frontendUrl = base;

  req.log.info({ query: req.query, redirectUri, frontendUrl }, "Discord OAuth callback received");

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    req.log.warn("Discord OAuth not configured (missing client id/secret)");
    res.redirect(`${frontendUrl}/login?error=discord_not_configured`);
    return;
  }
  const { code, error: discordError } = req.query;
  if (discordError) {
    req.log.warn({ discordError }, "Discord returned error in callback");
    res.redirect(`${frontendUrl}/login?error=discord_cancelled`);
    return;
  }
  if (!code || typeof code !== "string") {
    req.log.warn({ code }, "No code received in Discord callback");
    res.redirect(`${frontendUrl}/login?error=discord_cancelled`);
    return;
  }

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json() as any;
    req.log.info({ hasAccessToken: !!tokenData.access_token, tokenError: tokenData.error, redirectUri }, "Discord token exchange result");
    if (!tokenData.access_token) {
      req.log.warn({ tokenData }, "Discord token exchange failed");
      res.redirect(`${frontendUrl}/login?error=discord_token_failed`);
      return;
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const discordUser = await userRes.json() as any;

    if (!discordUser.id) {
      res.redirect(`${frontendUrl}/login?error=discord_user_failed`);
      return;
    }

    const discordAvatar = discordUser.avatar
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : null;

    let [user] = await db.select().from(usersTable).where(eq(usersTable.discordId, discordUser.id)).limit(1);

    if (!user) {
      if (discordUser.email) {
        [user] = await db.select().from(usersTable).where(eq(usersTable.email, discordUser.email)).limit(1);
      }
    }

    if (user) {
      await db.update(usersTable).set({
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discordAvatar,
        updatedAt: new Date(),
      }).where(eq(usersTable.id, user.id));
      const [updatedUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
      await ensureLeaderboardEntry(updatedUser.id, updatedUser.username, updatedUser.minecraftUsername, discordAvatar, updatedUser.activeRank).catch(() => {});
      const token = signToken({ id: updatedUser.id, username: updatedUser.username, role: updatedUser.role });
      res.redirect(`${frontendUrl}/dashboard?token=${token}`);
    } else {
      const username = discordUser.username.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20) || `user_${discordUser.id.slice(-6)}`;
      const email = discordUser.email || `${discordUser.id}@discord.placeholder`;
      const id = generateId();
      const tempPassword = await bcrypt.hash(generateId(), 10);

      const [newUser] = await db.insert(usersTable).values({
        id,
        username,
        email,
        passwordHash: tempPassword,
        role: "user",
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discordAvatar,
        emailVerified: Boolean(discordUser.email),
      }).returning();

      await ensureLeaderboardEntry(newUser.id, newUser.username, null, discordAvatar).catch(() => {});

      const token = signToken({ id: newUser.id, username: newUser.username, role: newUser.role });
      res.redirect(`${frontendUrl}/dashboard?token=${token}`);
    }
  } catch (err) {
    console.error("Discord OAuth error:", err);
    const base = getBaseUrl(req);
    res.redirect(`${base}/login?error=discord_error`);
  }
});

export default router;
