import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
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
  const msg = await ChatMessage.findOne({
    _id: id,
    userId: session.sub,
  }).exec();
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const deletedIds: string[] = [msg._id.toString()];

  // If deleting a user question, also drop the immediately-following assistant reply
  // in the same session — otherwise you'd have an orphaned answer to a deleted question.
  if (msg.role === "user") {
    const follower = await ChatMessage.findOne({
      userId: session.sub,
      sessionId: msg.sessionId,
      role: "assistant",
      createdAt: { $gt: msg.createdAt },
    })
      .sort({ createdAt: 1 })
      .exec();
    if (follower) {
      deletedIds.push(follower._id.toString());
      await follower.deleteOne();
    }
  }

  await msg.deleteOne();
  return NextResponse.json({ deletedIds });
}
