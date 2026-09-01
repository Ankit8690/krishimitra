import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { ChatSession } from "@/models/ChatSession";
import { ChatMessage } from "@/models/ChatMessage";
import { createSession, MAX_SESSIONS_PER_USER } from "@/lib/chatSessions";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();

  const rows = await ChatSession.find({ userId: session.sub })
    .sort({ lastMessageAt: -1 })
    .limit(MAX_SESSIONS_PER_USER)
    .lean()
    .exec();

  // Build a lightweight preview (first user message per session)
  const previews = await Promise.all(
    rows.map(async (s) => {
      const firstMsg = await ChatMessage.findOne({ sessionId: s._id, role: "user" })
        .sort({ createdAt: 1 })
        .lean()
        .exec();
      const count = await ChatMessage.countDocuments({ sessionId: s._id }).exec();
      return {
        id: s._id.toString(),
        title: s.title,
        lastMessageAt: s.lastMessageAt,
        createdAt: s.createdAt,
        preview: firstMsg?.content.slice(0, 90) ?? "",
        messageCount: count,
      };
    })
  );
  return NextResponse.json({ sessions: previews });
}

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = await createSession(session.sub);
  return NextResponse.json({ id: id.toString() });
}
