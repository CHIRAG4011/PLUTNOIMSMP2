import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const purchaseStatusEnum = pgEnum("purchase_status", ["pending", "completed", "failed", "refunded"]);

export const purchasesTable = pgTable("purchases", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  itemId: text("item_id").notNull(),
  itemName: text("item_name").notNull(),
  itemCategory: text("item_category").notNull(),
  pricePaid: integer("price_paid").notNull(),
  currency: text("currency").notNull(),
  couponUsed: text("coupon_used"),
  status: purchaseStatusEnum("status").notNull().default("completed"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPurchaseSchema = createInsertSchema(purchasesTable).omit({ id: true, createdAt: true });
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchasesTable.$inferSelect;
