import mongoose, { Schema, Model } from "mongoose";

export interface ILeaderboard {
  id: string;
  userId: string;
  username: string;
  minecraftUsername?: string | null;
  tier: string;
  kills: number;
  activeRank?: string | null;
  avatarUrl?: string | null;
  updatedAt: Date;
}

const leaderboardSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    minecraftUsername: { type: String, default: null },
    tier: { type: String, default: "LT5" },
    kills: { type: Number, default: 0 },
    activeRank: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

leaderboardSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const Leaderboard: Model<ILeaderboard> =
  (mongoose.models.Leaderboard as Model<ILeaderboard>) ||
  mongoose.model<ILeaderboard>("Leaderboard", leaderboardSchema);
