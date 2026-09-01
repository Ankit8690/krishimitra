import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 8000 },
    tokensIn: { type: Number },
    tokensOut: { type: Number },
  },
  { timestamps: true }
);

// Cap history per user by trimming — do it at write time with a bounded query.
export type ChatMessageDoc = InferSchemaType<typeof ChatMessageSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ChatMessage: Model<ChatMessageDoc> =
  (mongoose.models.ChatMessage as Model<ChatMessageDoc>) ||
  mongoose.model<ChatMessageDoc>("ChatMessage", ChatMessageSchema);
