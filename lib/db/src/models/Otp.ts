import mongoose, { Schema, Model } from "mongoose";

export interface IOtp {
  id: string;
  email: string;
  code: string;
  purpose: "registration" | "login" | "checkout";
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const otpSchema = new Schema(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: ["registration", "login", "checkout"], required: true },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

otpSchema.index({ email: 1, purpose: 1 });

otpSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const Otp: Model<IOtp> =
  (mongoose.models.Otp as Model<IOtp>) || mongoose.model<IOtp>("Otp", otpSchema);
