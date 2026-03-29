import { Router } from "express";
import bcrypt from "bcryptjs";
import { User, Otp, Leaderboard } from "@workspace/db";
import { signToken, requireAuth, AuthRequest } from "../lib/auth.js";
import { generateId } from "../lib/id.js";
import { sendOtpEmail, sendWelcomeEmail, sendLoginNotificationEmail } from "../lib/email.js";

async function ensureLeaderboardEntry(
  userId: string,
  username: string,
  minecraftUsername?: string | null,
  avatarUrl?: string | null,
  activeRank?: string | null
) {
  await Leaderboard.updateOne(
    { userId },
    {
      $setOnInsert: {
        _id: generateId(),
        userId,
        username,
        minecraftUsername: minecraftUsername || null,
        avatarUrl: avatarUrl || null,
        activeRank: activeRank || null,
        tier: "LT5",
        kills: 0,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
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
      const existing = await User.findOne({ email });
      if (existing) {
        res.status(400).json({ error: "Email already in use" });
        return;
      }
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.deleteMany({ email, purpose });
    await Otp.create({ _id: generateId(), email, code, purpose, expiresAt });

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

    const otp = await Otp.findOne({
      email,
      code,
      purpose,
      expiresAt: { $gt: new Date() },
    });

    if (!otp) {
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }

    otp.verified = true;
    await otp.save();

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

    const otp = await Otp.findOne({
      email,
      code: otpCode,
      purpose: "registration",
      verified: true,
      expiresAt: { $gt: new Date() },
    });

    if (!otp) {
      res.status(400).json({ error: "Invalid or expired verification code. Please verify your email first." });
      return;
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = generateId();
    const user = await User.create({
      _id: id,
      username,
      email,
      passwordHash,
      minecraftUsername: minecraftUsername || null,
      role: "user",
      emailVerified: true,
    });

    await Otp.deleteOne({ _id: otp._id });
    await sendWelcomeEmail(email, username).catch(() => {});
    await ensureLeaderboardEntry(user.id, user.username, user.minecraftUsername).catch(() => {});

    const token = signToken({ id: user.id, username: user.username, role: user.role });
    const safeUser = user.toJSON() as any;
    delete safeUser.passwordHash;
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
    const user = await User.findOne({ email });
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

    await Otp.deleteMany({ email, purpose: "login" });
    await Otp.create({ _id: generateId(), email, code, purpose: "login", expiresAt });

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

    const otp = await Otp.findOne({
      email,
      code: otpCode,
      purpose: "login",
      expiresAt: { $gt: new Date() },
    });

    if (!otp) {
      res.status(400).json({ error: "Invalid or expired code" });
      return;
    }

    await Otp.deleteOne({ _id: otp._id });

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const token = signToken({ id: user.id, username: user.username, role: user.role });
    const safeUser = user.toJSON() as any;
    delete safeUser.passwordHash;

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
    const user = await User.findOne({ _id: req.user!.id });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const safeUser = user.toJSON() as any;
    delete safeUser.passwordHash;
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
  const replitDomains = process.env.REPLIT_DOMAINS;
  if (replitDomains) return `https://${replitDomains.split(",")[0].trim()}`;
  const replitDevDomain = process.env.REPLIT_DEV_DOMAIN;
  if (replitDevDomain) return `https://${replitDevDomain}`;
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  const forwardedHost = req.get("x-forwarded-host");
  if (forwardedHost && !forwardedHost.includes("localhost")) {
    const proto = req.get("x-forwarded-proto") || "https";
    return `${proto}://${forwardedHost}`;
  }
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
  req.log.info({ redirectUri }, "Discord OAuth initiated");
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
    res.redirect(`${frontendUrl}/login?error=discord_not_configured`);
    return;
  }
  const { code, error: discordError } = req.query;
  if (discordError || !code || typeof code !== "string") {
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

    let user = await User.findOne({ discordId: discordUser.id });
    if (!user && discordUser.email) {
      user = await User.findOne({ email: discordUser.email });
    }

    if (user) {
      await User.updateOne(
        { _id: user._id },
        { discordId: discordUser.id, discordUsername: discordUser.username, discordAvatar, updatedAt: new Date() }
      );
      const updatedUser = await User.findOne({ _id: user._id });
      if (updatedUser) {
        await ensureLeaderboardEntry(updatedUser.id, updatedUser.username, updatedUser.minecraftUsername, discordAvatar, updatedUser.activeRank).catch(() => {});
        const token = signToken({ id: updatedUser.id, username: updatedUser.username, role: updatedUser.role });
        res.redirect(`${frontendUrl}/dashboard?token=${token}`);
      }
    } else {
      const username =
        discordUser.username.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 20) ||
        `user_${discordUser.id.slice(-6)}`;
      const email = discordUser.email || `${discordUser.id}@discord.placeholder`;
      const id = generateId();
      const tempPassword = await bcrypt.hash(generateId(), 10);

      const newUser = await User.create({
        _id: id,
        username,
        email,
        passwordHash: tempPassword,
        role: "user",
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discordAvatar,
        emailVerified: Boolean(discordUser.email),
      });

      await ensureLeaderboardEntry(newUser.id, newUser.username, null, discordAvatar).catch(() => {});
      const token = signToken({ id: newUser.id, username: newUser.username, role: newUser.role });
      res.redirect(`${frontendUrl}/dashboard?token=${token}`);
    }
  } catch (err) {
    req.log.error(err, "Discord OAuth error");
    res.redirect(`${frontendUrl}/login?error=discord_error`);
  }
});

export default router;
