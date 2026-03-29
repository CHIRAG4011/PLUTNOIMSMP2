import mongoose, { Schema, Model } from "mongoose";

export interface ITicketMessage {
  id: string;
  ticketId: string;
  userId: string;
  username: string;
  role: string;
  content: string;
  isStaff: boolean;
  createdAt: Date;
}

const ticketMessageSchema = new Schema(
  {
    _id: { type: String, required: true },
    ticketId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    role: { type: String, default: "user" },
    content: { type: String, required: true },
    isStaff: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

ticketMessageSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const TicketMessage: Model<ITicketMessage> =
  (mongoose.models.TicketMessage as Model<ITicketMessage>) ||
  mongoose.model<ITicketMessage>("TicketMessage", ticketMessageSchema);
