import mongoose, { Schema, Model } from "mongoose";

export interface IPurchase {
  id: string;
  userId: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  pricePaid: number;
  currency: string;
  couponUsed?: string | null;
  status: "pending" | "completed" | "failed" | "refunded";
  createdAt: Date;
}

const purchaseSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    itemCategory: { type: String, required: true },
    pricePaid: { type: Number, required: true },
    currency: { type: String, required: true },
    couponUsed: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

purchaseSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const Purchase: Model<IPurchase> =
  (mongoose.models.Purchase as Model<IPurchase>) ||
  mongoose.model<IPurchase>("Purchase", purchaseSchema);
