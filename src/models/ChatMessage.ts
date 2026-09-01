import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "ChatSession", index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 8000 },
    tokensIn: { type: Number },
    tokensOut: { type: Number },
  },
  { timestamps: true }
);

export type ChatMessageDoc = InferSchemaType<typeof ChatMessageSchema> & {
  _id: mongoose.Types.ObjectId;
};

// Dev-time safeguard: if the cached model was registered before we added
// sessionId to the schema, its schema won't have that path and Mongoose will
// silently drop it on every write. Detect and rebuild in that case.
function getModel(): Model<ChatMessageDoc> {
  const existing = mongoose.models.ChatMessage as Model<ChatMessageDoc> | undefined;
  if (existing && !existing.schema.path("sessionId")) {
    mongoose.deleteModel("ChatMessage");
    return mongoose.model<ChatMessageDoc>("ChatMessage", ChatMessageSchema);
  }
  return existing ?? mongoose.model<ChatMessageDoc>("ChatMessage", ChatMessageSchema);
}

export const ChatMessage: Model<ChatMessageDoc> = getModel();
