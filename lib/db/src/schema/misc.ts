import { pgTable, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const announcementTypeEnum = pgEnum("announcement_type", ["info", "warning", "update", "event"]);

export const announcementsTable = pgTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: announcementTypeEnum("type").notNull().default("info"),
  isActive: boolean("is_active").notNull().default(true),
  authorId: text("author_id"),
  authorName: text("author_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const couponsTable = pgTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").notNull(),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leaderboardTable = pgTable("leaderboard", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  username: text("username").notNull(),
  minecraftUsername: text("minecraft_username"),
  hearts: integer("hearts").notNull().default(10),
  kills: integer("kills").notNull().default(0),
  owoBalance: integer("owo_balance").notNull().default(0),
  activeRank: text("active_rank"),
  avatarUrl: text("avatar_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(announcementsTable).omit({ id: true, createdAt: true });
export const insertCouponSchema = createInsertSchema(couponsTable).omit({ id: true, createdAt: true });
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcementsTable.$inferSelect;
export type Coupon = typeof couponsTable.$inferSelect;
