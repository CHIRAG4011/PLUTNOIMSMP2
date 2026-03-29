import mongoose, { Schema, Model } from "mongoose";

export interface IStoreItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  imageUrl?: string | null;
  images: string[];
  features: string[];
  isActive: boolean;
  isFeatured: boolean;
  badge?: string | null;
  badgeColor?: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const storeItemSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: "usd" },
    imageUrl: { type: String, default: null },
    images: { type: [String], default: [] },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    badge: { type: String, default: null },
    badgeColor: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

storeItemSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const StoreItem: Model<IStoreItem> =
  (mongoose.models.StoreItem as Model<IStoreItem>) ||
  mongoose.model<IStoreItem>("StoreItem", storeItemSchema);
