import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { ChatSession } from "@/models/ChatSession";
import { ChatMessage } from "@/models/ChatMessage";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await dbConnect();
  const doc = await ChatSession.findOne({ _id: id, userId: session.sub }).exec();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await Promise.all([
    ChatMessage.deleteMany({ sessionId: doc._id }).exec(),
    doc.deleteOne(),
  ]);
  return NextResponse.json({ ok: true });
}
