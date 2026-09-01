import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { ChatMessage } from "@/models/ChatMessage";
import { buildFarmerContext } from "@/lib/farmerContext";
import { chatCompletion, type ChatMessage as LLMMsg } from "@/lib/groq";
import { CHAT_LANGUAGES, type ChatLangCode } from "@/lib/languages";

const HISTORY_TURNS = 6; // last N user+assistant messages included
const LANG_CODES = CHAT_LANGUAGES.map((l) => l.code) as [ChatLangCode, ...ChatLangCode[]];
const Body = z.object({
  message: z.string().min(1).max(2000),
  language: z.enum(LANG_CODES).optional(),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      {
        error:
          "GROQ_API_KEY is not configured. Add it to .env.local — free at https://console.groq.com",
      },
      { status: 503 }
    );
  }

  await dbConnect();

  // Persist the user message first so history is complete even if LLM fails
  const userMsg = await ChatMessage.create({
    userId: session.sub,
    role: "user",
    content: parsed.data.message,
  });

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
      .filter((m) => m._id.toString() !== userMsg._id.toString())
      .map<LLMMsg>((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));

    const messages: LLMMsg[] = [
      { role: "system", content: context.system },
      ...prior,
      { role: "user", content: parsed.data.message },
    ];

    const reply = await chatCompletion(messages, {
      temperature: 0.4,
      maxTokens: 700,
    });

    const asstMsg = await ChatMessage.create({
      userId: session.sub,
      role: "assistant",
      content: reply,
    });

    return NextResponse.json({
      user: {
        id: userMsg._id.toString(),
        role: "user",
        content: userMsg.content,
        createdAt: userMsg.createdAt,
      },
      assistant: {
        id: asstMsg._id.toString(),
        role: "assistant",
        content: asstMsg.content,
        createdAt: asstMsg.createdAt,
      },
    });
  } catch (err) {
    console.error("[chat] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Chat failed" },
      { status: 502 }
    );
  }
}
