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

    // For registration, check email isn't already registered
    if (purpose === "registration") {
      const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
      if (existing.length > 0) {
        res.status(400).json({ error: "Email already in use" });
        return;
      }
    }

    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Delete old OTPs for this email+purpose
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

    // Verify OTP
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

    // Clean up OTP
    await db.delete(otpsTable).where(eq(otpsTable.id, otp.id));

    // Send welcome email
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
    const token = signToken({ id: user.id, username: user.username, role: user.role });
    const { passwordHash: _, ...safeUser } = user;

    // Send login notification email (fire-and-forget)
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

export default router;
