import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

// Common action codes — grep-friendly, not enforced (strict:false)
export type ActivityAction =
  | "auth.signup_requested"
  | "auth.signup_verified"
  | "auth.login_success"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.otp_resent"
  | "onboarding.completed"
  | "profile.updated"
  | "chat.message"
  | "chat.session_created"
  | "chat.session_deleted"
  | "scan.disease"
  | "ml.crop_recommend"
  | "ml.fertilizer_advise"
  | "ml.yield_predict"
  | "feedback.submitted"
  | "community.post_created"
  | "community.post_deleted";

const ActivityLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, index: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true, strict: false }
);

ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 });

export type ActivityLogDoc = InferSchemaType<typeof ActivityLogSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

if (process.env.NODE_ENV !== "production" && mongoose.models.ActivityLog) {
  delete (mongoose.models as Record<string, unknown>).ActivityLog;
}

export const ActivityLog: Model<ActivityLogDoc> =
  (mongoose.models.ActivityLog as Model<ActivityLogDoc>) ||
  mongoose.model<ActivityLogDoc>("ActivityLog", ActivityLogSchema);
