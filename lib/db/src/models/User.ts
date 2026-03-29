import mongoose, { Schema, Model } from "mongoose";

export interface IUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: "user" | "moderator" | "admin" | "owner";
  discordId?: string | null;
  discordUsername?: string | null;
  discordAvatar?: string | null;
  minecraftUsername?: string | null;
  owoBalance: number;
  isBanned: boolean;
  banReason?: string | null;
  activeRank?: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema(
  {
    _id: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "moderator", "admin", "owner"], default: "user" },
    discordId: { type: String, default: null },
    discordUsername: { type: String, default: null },
    discordAvatar: { type: String, default: null },
    minecraftUsername: { type: String, default: null },
    owoBalance: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: null },
    activeRank: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    emailVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

userSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>("User", userSchema);
