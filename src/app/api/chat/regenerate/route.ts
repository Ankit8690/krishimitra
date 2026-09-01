import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { ChatMessage } from "@/models/ChatMessage";
import { buildFarmerContext } from "@/lib/farmerContext";
import { chatCompletion, type ChatMessage as LLMMsg } from "@/lib/groq";
import { CHAT_LANGUAGES, type ChatLangCode } from "@/lib/languages";

const HISTORY_TURNS = 6;
const LANG_CODES = CHAT_LANGUAGES.map((l) => l.code) as [ChatLangCode, ...ChatLangCode[]];
const Body = z.object({ language: z.enum(LANG_CODES).optional() });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await dbConnect();

  // Drop the most recent assistant message (if any) so we can produce a fresh one
  const lastAssistant = await ChatMessage.findOne({
    userId: session.sub,
    role: "assistant",
  })
    .sort({ createdAt: -1 })
    .exec();
  if (lastAssistant) await lastAssistant.deleteOne();

  const lastUser = await ChatMessage.findOne({
    userId: session.sub,
    role: "user",
  })
    .sort({ createdAt: -1 })
    .exec();
  if (!lastUser) {
    return NextResponse.json({ error: "Nothing to regenerate" }, { status: 400 });
  }

  try {
    const [context, history] = await Promise.all([
      buildFarmerContext(session.sub, parsed.data.language),
      ChatMessage.find({ userId: session.sub })
        .sort({ createdAt: -1 })
        .limit(HISTORY_TURNS * 2)
        .lean()
        .exec(),
    ]);

    const prior = history
      .reverse()
      .filter((m) => m._id.toString() !== lastUser._id.toString())
      .map<LLMMsg>((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));

    const messages: LLMMsg[] = [
      { role: "system", content: context.system },
      ...prior,
      { role: "user", content: lastUser.content },
    ];

    const reply = await chatCompletion(messages, {
      temperature: 0.6, // slightly higher — encourages a different answer
      maxTokens: 700,
    });

    const asstMsg = await ChatMessage.create({
      userId: session.sub,
      role: "assistant",
      content: reply,
    });

    return NextResponse.json({
      assistant: {
        id: asstMsg._id.toString(),
        role: "assistant",
        content: asstMsg.content,
        createdAt: asstMsg.createdAt,
      },
    });
  } catch (err) {
    console.error("[chat/regenerate] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Regenerate failed" },
      { status: 502 }
    );
  }
}
