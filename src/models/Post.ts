import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const PostSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    authorName: { type: String, required: true },
    type: {
      type: String,
      enum: ["equipment", "seed", "labour", "produce", "other"],
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 2000 },
    contact: { type: String, maxlength: 60 },
    state: { type: String, index: true },
    district: { type: String, index: true },
    priceInr: { type: Number },
  },
  { timestamps: true }
);

PostSchema.index({ createdAt: -1 });

export type PostDoc = InferSchemaType<typeof PostSchema> & {
  _id: mongoose.Types.ObjectId;
};

if (process.env.NODE_ENV !== "production" && mongoose.models.Post) {
  delete (mongoose.models as Record<string, unknown>).Post;
}

export const Post: Model<PostDoc> =
  (mongoose.models.Post as Model<PostDoc>) ||
  mongoose.model<PostDoc>("Post", PostSchema);
