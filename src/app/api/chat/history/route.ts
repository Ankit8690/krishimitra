import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { ChatMessage } from "@/models/ChatMessage";
import { ensureCurrentSession } from "@/lib/chatSessions";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();

  const url = new URL(req.url);
  let sessionId = url.searchParams.get("sessionId");
  if (sessionId && !mongoose.isValidObjectId(sessionId)) {
    return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
  }
  if (!sessionId) {
    const current = await ensureCurrentSession(session.sub);
    sessionId = current.toString();
  }

  const rows = await ChatMessage.find({ userId: session.sub, sessionId })
    .sort({ createdAt: 1 })
    .limit(200)
    .lean()
    .exec();

  return NextResponse.json({
    sessionId,
    messages: rows.map((m) => ({
      id: m._id.toString(),
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
      imageUrl: m.imageUrl ?? undefined,
    })),
  });
}

/** Delete the *current* session — kept for backward compatibility with the trash button */
export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const sessionId = await ensureCurrentSession(session.sub);
  await ChatMessage.deleteMany({ userId: session.sub, sessionId }).exec();
  return NextResponse.json({ ok: true });
}
