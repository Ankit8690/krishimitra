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
    // Map crop name → ISO date string of sowing. Powers today's task card.
    sowingDates: { type: Map, of: String, default: () => ({}) },
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

const ChatPrefsSchema = new Schema(
  {
    // "ask" (default): show a Read-aloud button under each reply
    // "always": auto-speak every reply
    // "never": hide read-aloud entirely
    readAloud: {
      type: String,
      enum: ["ask", "always", "never"],
      default: "ask",
    },
    // Chat can use any of the 13 Indian languages; falls back to preferredLanguage.
    chatLanguage: { type: String },
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
    chatPrefs: { type: ChatPrefsSchema, default: () => ({}) },
    emailVerified: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, strict: false }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  emailVerified?: boolean;
  disabled?: boolean;
};

if (process.env.NODE_ENV !== "production" && mongoose.models.User) {
  delete (mongoose.models as Record<string, unknown>).User;
}

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", UserSchema);
