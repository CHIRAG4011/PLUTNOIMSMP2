import mongoose, { Schema, Model } from "mongoose";

export interface IProductReview {
  id: string;
  itemId: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

const productReviewSchema = new Schema(
  {
    _id: { type: String, required: true },
    itemId: { type: String, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

productReviewSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const ProductReview: Model<IProductReview> =
  (mongoose.models.ProductReview as Model<IProductReview>) ||
  mongoose.model<IProductReview>("ProductReview", productReviewSchema);
