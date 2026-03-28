import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable, otpsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { signToken, requireAuth, AuthRequest } from "../lib/auth.js";
import { generateId } from "../lib/id.js";
import { sendOtpEmail, sendWelcomeEmail, sendLoginNotificationEmail } from "../lib/email.js";

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
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "";
const FRONTEND_URL = process.env.FRONTEND_URL || "";

router.get("/discord", (req, res) => {
  if (!DISCORD_CLIENT_ID || !DISCORD_REDIRECT_URI) {
    res.status(501).json({ error: "Discord OAuth not configured" });
    return;
  }
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify email",
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`);
});

router.get("/discord/callback", async (req, res) => {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI) {
    res.redirect(`${FRONTEND_URL}/login?error=discord_not_configured`);
    return;
  }
  const { code } = req.query;
  if (!code || typeof code !== "string") {
    res.redirect(`${FRONTEND_URL}/login?error=discord_cancelled`);
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
        redirect_uri: DISCORD_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) {
      res.redirect(`${FRONTEND_URL}/login?error=discord_token_failed`);
      return;
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const discordUser = await userRes.json() as any;

    if (!discordUser.id) {
      res.redirect(`${FRONTEND_URL}/login?error=discord_user_failed`);
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
      const token = signToken({ id: updatedUser.id, username: updatedUser.username, role: updatedUser.role });
      res.redirect(`${FRONTEND_URL}/dashboard?token=${token}`);
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

      const token = signToken({ id: newUser.id, username: newUser.username, role: newUser.role });
      res.redirect(`${FRONTEND_URL}/dashboard?token=${token}`);
    }
  } catch (err) {
    console.error("Discord OAuth error:", err);
    res.redirect(`${FRONTEND_URL}/login?error=discord_error`);
  }
});

export default router;
