import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const ChatSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, maxlength: 120 },
    lastMessageAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
);

// Compound index for "sessions for this user, newest first"
ChatSessionSchema.index({ userId: 1, lastMessageAt: -1 });

export type ChatSessionDoc = InferSchemaType<typeof ChatSessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ChatSession: Model<ChatSessionDoc> =
  (mongoose.models.ChatSession as Model<ChatSessionDoc>) ||
  mongoose.model<ChatSessionDoc>("ChatSession", ChatSessionSchema);
