import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "ChatSession", index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 8000 },
    // Optional data-URL of an attached image (leaf photo). Kept small (< 300 KB after client-side compression).
    imageUrl: { type: String, maxlength: 500_000 },
    // Populated by the disease-detection pipeline when an image is attached.
    imageAnalysis: {
      label: String,
      confidence: Number,
      severity: String,
    },
    tokensIn: { type: Number },
    tokensOut: { type: Number },
  },
  { timestamps: true }
);

export type ChatMessageDoc = InferSchemaType<typeof ChatMessageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ChatMessage: Model<ChatMessageDoc> =
  (mongoose.models.ChatMessage as Model<ChatMessageDoc>) ||
  mongoose.model<ChatMessageDoc>("ChatMessage", ChatMessageSchema);
