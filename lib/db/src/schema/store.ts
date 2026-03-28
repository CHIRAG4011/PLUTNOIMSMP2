import { pgTable, text, integer, boolean, timestamp, pgEnum, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const categoryEnum = pgEnum("item_category", ["ranks", "crate_keys", "coins", "cosmetics"]);
export const currencyEnum = pgEnum("item_currency", ["owo", "usd"]);

export const storeItemsTable = pgTable("store_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: categoryEnum("category").notNull(),
  price: integer("price").notNull(),
  currency: currencyEnum("currency").notNull().default("owo"),
  imageUrl: text("image_url"),
  features: json("features").$type<string[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  badge: text("badge"),
  badgeColor: text("badge_color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStoreItemSchema = createInsertSchema(storeItemsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStoreItem = z.infer<typeof insertStoreItemSchema>;
export type StoreItem = typeof storeItemsTable.$inferSelect;
