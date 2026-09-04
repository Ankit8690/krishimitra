import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const PendingSignupSchema = new Schema(
  {
    email: { type: String, required: true, index: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    phone: { type: String },
    passwordHash: { type: String, required: true },
    preferredLanguage: { type: String, enum: ["en", "hi", "pa"], default: "en" },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    resends: { type: Number, default: 0 },
  },
  { timestamps: true, strict: false }
);

// TTL — auto-delete pending signups 1 hour after creation
PendingSignupSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 });

export type PendingSignupDoc = InferSchemaType<typeof PendingSignupSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

if (process.env.NODE_ENV !== "production" && mongoose.models.PendingSignup) {
  delete (mongoose.models as Record<string, unknown>).PendingSignup;
}

export const PendingSignup: Model<PendingSignupDoc> =
  (mongoose.models.PendingSignup as Model<PendingSignupDoc>) ||
  mongoose.model<PendingSignupDoc>("PendingSignup", PendingSignupSchema);
