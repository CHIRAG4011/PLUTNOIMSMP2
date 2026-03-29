import mongoose, { Schema, Model } from "mongoose";

export interface ICoupon {
  id: string;
  code: string;
  discountPercent: number;
  usageLimit?: number | null;
  usageCount: number;
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
}

const couponSchema = new Schema(
  {
    _id: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    discountPercent: { type: Number, required: true },
    usageLimit: { type: Number, default: null },
    usageCount: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

couponSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const Coupon: Model<ICoupon> =
  (mongoose.models.Coupon as Model<ICoupon>) || mongoose.model<ICoupon>("Coupon", couponSchema);
