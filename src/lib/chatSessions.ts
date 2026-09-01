import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { ChatSession } from "@/models/ChatSession";
import { ChatMessage } from "@/models/ChatMessage";

export const MAX_SESSIONS_PER_USER = 10;

/**
 * Ensure the user has at least one session, migrating any pre-session
 * orphan messages into a legacy "Previous chats" session on first hit.
 */
export async function ensureCurrentSession(
  userId: string
): Promise<mongoose.Types.ObjectId> {
  await dbConnect();
  let current = await ChatSession.findOne({ userId })
    .sort({ lastMessageAt: -1 })
    .exec();
  if (!current) {
    // Migrate old flat-history messages into a single legacy session
    const orphanCount = await ChatMessage.countDocuments({
      userId,
      sessionId: { $exists: false },
    }).exec();
    const title = orphanCount > 0 ? "Previous chats" : "New chat";
    current = await ChatSession.create({ userId, title });
    if (orphanCount > 0) {
      await ChatMessage.updateMany(
        { userId, sessionId: { $exists: false } },
        { $set: { sessionId: current._id } }
      ).exec();
    }
  }
  return current._id;
}

/** Create a new session for the user; enforce the 10-session cap. */
export async function createSession(
  userId: string,
  title = "New chat"
): Promise<mongoose.Types.ObjectId> {
  await dbConnect();
  const session = await ChatSession.create({ userId, title });
  await enforceSessionCap(userId);
  return session._id;
}

/** Delete oldest sessions (and their messages) beyond MAX_SESSIONS_PER_USER. */
export async function enforceSessionCap(userId: string): Promise<void> {
  const total = await ChatSession.countDocuments({ userId }).exec();
  if (total <= MAX_SESSIONS_PER_USER) return;
  const toDelete = total - MAX_SESSIONS_PER_USER;
  const oldest = await ChatSession.find({ userId })
    .sort({ lastMessageAt: 1 })
    .limit(toDelete)
    .exec();
  const ids = oldest.map((s) => s._id);
  if (ids.length === 0) return;
  await Promise.all([
    ChatMessage.deleteMany({ userId, sessionId: { $in: ids } }).exec(),
    ChatSession.deleteMany({ _id: { $in: ids } }).exec(),
  ]);
}

/** Derive a short human-readable title from a message. */
export function deriveTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= 40 ? clean : `${clean.slice(0, 40).trimEnd()}…`;
}
