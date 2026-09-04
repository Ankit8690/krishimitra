import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const FeedbackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true, maxlength: 80 },
    email: { type: String, maxlength: 120 },
    phone: { type: String, maxlength: 20 },
    state: { type: String, maxlength: 60 },
    district: { type: String, maxlength: 60 },
    category: {
      type: String,
      enum: ["bug", "suggestion", "praise", "feature", "other"],
      required: true,
      index: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    message: { type: String, required: true, maxlength: 3000 },
    status: {
      type: String,
      enum: ["new", "read", "in_progress", "resolved", "archived"],
      default: "new",
      index: true,
    },
    starred: { type: Boolean, default: false, index: true },
    adminNote: { type: String, maxlength: 2000, default: "" },
  },
  { timestamps: true, strict: false }
);

FeedbackSchema.index({ createdAt: -1 });

export type FeedbackDoc = InferSchemaType<typeof FeedbackSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

if (process.env.NODE_ENV !== "production" && mongoose.models.Feedback) {
  delete (mongoose.models as Record<string, unknown>).Feedback;
}

export const Feedback: Model<FeedbackDoc> =
  (mongoose.models.Feedback as Model<FeedbackDoc>) ||
  mongoose.model<FeedbackDoc>("Feedback", FeedbackSchema);
