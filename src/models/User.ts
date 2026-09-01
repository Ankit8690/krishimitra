import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const FarmSchema = new Schema(
  {
    landSizeAcres: { type: Number, default: 0 },
    soilType: {
      type: String,
      enum: ["black", "red", "sandy", "loamy", "clay", "alluvial", "unknown"],
      default: "unknown",
    },
    irrigation: {
      type: String,
      enum: ["borewell", "canal", "rainfed", "drip", "sprinkler", "unknown"],
      default: "unknown",
    },
    primaryCrops: { type: [String], default: [] },
  },
  { _id: false }
);

const LocationSchema = new Schema(
  {
    lat: { type: Number },
    lon: { type: Number },
    district: { type: String },
    state: { type: String },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    preferredLanguage: {
      type: String,
      enum: ["en", "hi", "pa"],
      default: "en",
    },
    location: { type: LocationSchema, default: () => ({}) },
    farm: { type: FarmSchema, default: () => ({}) },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", UserSchema);
