import { pgTable, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["user", "moderator", "admin", "owner"]);

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  discordId: text("discord_id"),
  discordUsername: text("discord_username"),
  discordAvatar: text("discord_avatar"),
  minecraftUsername: text("minecraft_username"),
  owoBalance: integer("owo_balance").notNull().default(0),
  isBanned: boolean("is_banned").notNull().default(false),
  banReason: text("ban_reason"),
  activeRank: text("active_rank"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
