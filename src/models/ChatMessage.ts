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
  {
    timestamps: true,
    // strict:false lets us persist newly added fields even if Next.js dev has
    // cached the model in memory from before a schema change. Prevents the
    // silent-drop bug we hit after adding sessionId and again after imageUrl.
    strict: false,
  }
);

export type ChatMessageDoc = InferSchemaType<typeof ChatMessageSchema> & {
  _id: mongoose.Types.ObjectId;
};

// In dev, force-rebuild the model whenever this file is (re-)imported, so
// schema changes are picked up without a full server restart.
if (process.env.NODE_ENV !== "production" && mongoose.models.ChatMessage) {
  delete (mongoose.models as Record<string, unknown>).ChatMessage;
}

export const ChatMessage: Model<ChatMessageDoc> =
  (mongoose.models.ChatMessage as Model<ChatMessageDoc>) ||
  mongoose.model<ChatMessageDoc>("ChatMessage", ChatMessageSchema);
