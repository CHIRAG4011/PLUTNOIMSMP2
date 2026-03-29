import mongoose, { Schema, Model } from "mongoose";

export interface ITicket {
  id: string;
  userId: string;
  username: string;
  subject: string;
  category: string;
  status: "open" | "pending" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    subject: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, enum: ["open", "pending", "closed"], default: "open" },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    messageCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

ticketSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const Ticket: Model<ITicket> =
  (mongoose.models.Ticket as Model<ITicket>) || mongoose.model<ITicket>("Ticket", ticketSchema);
