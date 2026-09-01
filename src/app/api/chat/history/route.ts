import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { ChatMessage } from "@/models/ChatMessage";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  const rows = await ChatMessage.find({ userId: session.sub })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()
    .exec();
  return NextResponse.json({
    messages: rows
      .reverse()
      .map((m) => ({
        id: m._id.toString(),
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
  });
}

export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();
  await ChatMessage.deleteMany({ userId: session.sub }).exec();
  return NextResponse.json({ ok: true });
}
