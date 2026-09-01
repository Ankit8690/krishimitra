import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import { ChatSession } from "@/models/ChatSession";
import { ChatMessage } from "@/models/ChatMessage";

export const MAX_SESSIONS_PER_USER = 10;

/**
 * Ensure the user has at least one session AND that no orphaned messages
 * exist. Any messages without a sessionId get bundled into a "Previous chats"
 * session (created on demand). Runs on every call so it's self-healing —
 * covers both first-time migration and any drift from earlier bugs.
 */
export async function ensureCurrentSession(
  userId: string
): Promise<mongoose.Types.ObjectId> {
  await dbConnect();

  // 1. Rescue any orphaned messages, always.
  const orphanCount = await ChatMessage.countDocuments({
    userId,
    sessionId: { $exists: false },
  }).exec();

  if (orphanCount > 0) {
    let legacy = await ChatSession.findOne({
      userId,
      title: "Previous chats",
    }).exec();
    if (!legacy) {
      legacy = await ChatSession.create({
        userId,
        title: "Previous chats",
        // Give it a slightly past timestamp so newer chats sort above it
        lastMessageAt: new Date(Date.now() - 1000),
      });
    }
    await ChatMessage.updateMany(
      { userId, sessionId: { $exists: false } },
      { $set: { sessionId: legacy._id } }
    ).exec();
  }

  // 2. Return the most recently active session, creating one if none exists.
  let current = await ChatSession.findOne({ userId })
    .sort({ lastMessageAt: -1 })
    .exec();
  if (!current) {
    current = await ChatSession.create({ userId, title: "New chat" });
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
