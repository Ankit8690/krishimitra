import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { ChatMessage } from "@/models/ChatMessage";
import { ChatSession } from "@/models/ChatSession";
import { buildFarmerContext } from "@/lib/farmerContext";
import {
  chatCompletion,
  chatCompletionStream,
  type ChatMessage as LLMMsg,
} from "@/lib/groq";
import { CHAT_LANGUAGES, type ChatLangCode } from "@/lib/languages";
import { deriveTitle, ensureCurrentSession } from "@/lib/chatSessions";
import { CHAT_TOOLS, runTool } from "@/lib/chatTools";
import { detectDisease } from "@/lib/disease";

const HISTORY_TURNS = 6;
const MAX_TOOL_TURNS = 3;
const LANG_CODES = CHAT_LANGUAGES.map((l) => l.code) as [ChatLangCode, ...ChatLangCode[]];
const Body = z.object({
  message: z.string().min(1).max(2000),
  language: z.enum(LANG_CODES).optional(),
  sessionId: z.string().optional(),
  // data-URL of an attached image (e.g. leaf photo). Client should compress to < 300 KB.
  imageDataUrl: z.string().max(400_000).optional(),
});

// Newline-delimited JSON events streamed back to the browser
type Event =
  | { type: "session"; sessionId: string }
  | { type: "user"; message: MsgOut }
  | { type: "token"; text: string }
  | { type: "done"; message: MsgOut }
  | { type: "error"; error: string };

type MsgOut = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  imageUrl?: string;
};

// SSE format: each event is `data: <json>\n\n`. Browsers do NOT buffer
// text/event-stream, which is why we prefer it over NDJSON in dev.
function encodeEvent(evt: Event): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(evt)}\n\n`);
}

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

  const { message, language, sessionId, imageDataUrl } = parsed.data;

  await dbConnect();

  // Resolve or create the session
  let sessionOid: mongoose.Types.ObjectId;
  if (sessionId && mongoose.isValidObjectId(sessionId)) {
    const existing = await ChatSession.findOne({
      _id: sessionId,
      userId: session.sub,
    }).exec();
    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    sessionOid = existing._id;
  } else {
    sessionOid = await ensureCurrentSession(session.sub);
  }

  const isFirstMessage =
    (await ChatMessage.countDocuments({ sessionId: sessionOid })) === 0;

  // If an image was attached, run disease detection now — the result gets folded
  // into the LLM's context so it can advise contextually.
  let imageAnalysis: { label: string; confidence: number; severity: string } | undefined;
  let imageAnnotation = "";
  if (imageDataUrl) {
    try {
      const commaIdx = imageDataUrl.indexOf(",");
      const b64 = commaIdx >= 0 ? imageDataUrl.slice(commaIdx + 1) : imageDataUrl;
      const buf = Buffer.from(b64, "base64");
      const pred = await detectDisease(buf.buffer as ArrayBuffer);
      imageAnalysis = {
        label: pred.displayName,
        confidence: pred.confidence,
        severity: pred.severity,
      };
      const treatSummary = pred.treatment.slice(0, 3).join("; ");
      const conf = Math.round(pred.confidence * 100);
      if (pred.uncertain) {
        imageAnnotation = `\n\n[Attached leaf photo — AI is UNCERTAIN. Top guess: ${pred.displayName} (${conf}%). Ask the user for a clearer photo before recommending treatment.]`;
      } else {
        imageAnnotation = `\n\n[Attached leaf photo — AI diagnosis: ${pred.displayName} (${conf}% confidence, severity: ${pred.severity}). Standard treatment steps: ${treatSummary}. Interpret this for the user in their language and personalise to their crop and farm.]`;
      }
    } catch (err) {
      console.warn("[chat] disease detection failed", err);
      imageAnnotation =
        "\n\n[User attached a leaf photo but disease detection failed. Suggest they retake in daylight and try again.]";
    }
  }

  // Persist the user message first so history is intact even if the LLM fails.
  const userMsg = await ChatMessage.create({
    userId: session.sub,
    sessionId: sessionOid,
    role: "user",
    content: message,
    imageUrl: imageDataUrl,
    imageAnalysis,
  });

  if (isFirstMessage) {
    await ChatSession.updateOne(
      { _id: sessionOid },
      {
        $set: {
          title: deriveTitle(imageDataUrl ? `Leaf photo: ${message}` : message),
          lastMessageAt: new Date(),
        },
      }
    ).exec();
  }

  const userMsgOut: MsgOut = {
    id: userMsg._id.toString(),
    role: "user",
    content: userMsg.content,
    createdAt: userMsg.createdAt,
    imageUrl: userMsg.imageUrl ?? undefined,
  };

  // Stream response as newline-delimited JSON
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (e: Event) => controller.enqueue(encodeEvent(e));
      try {
        send({ type: "session", sessionId: sessionOid.toString() });
        send({ type: "user", message: userMsgOut });

        const [context, history] = await Promise.all([
          buildFarmerContext(session.sub, language),
          ChatMessage.find({ userId: session.sub, sessionId: sessionOid })
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
          { role: "user", content: message + imageAnnotation },
        ];

        // Tool loop (non-streaming) — resolves any get_mandi_prices / get_weather calls
        for (let turn = 0; turn < MAX_TOOL_TURNS; turn++) {
          const resp = await chatCompletion(messages, {
            temperature: 0.4,
            maxTokens: 700,
            tools: CHAT_TOOLS,
          });
          if (!resp.toolCalls || resp.toolCalls.length === 0) {
            // No tool call — model wants to answer. If it already produced text
            // above the tool_calls threshold, emit it; then stream the final turn.
            break;
          }
          messages.push({
            role: "assistant",
            content: resp.content,
            tool_calls: resp.toolCalls,
          });
          for (const call of resp.toolCalls) {
            const result = await runTool(call.function.name, call.function.arguments);
            console.log(
              `[chat] tool ${call.function.name}(${call.function.arguments.slice(0, 80)}) → ${result.slice(0, 80)}…`
            );
            messages.push({
              role: "tool",
              tool_call_id: call.id,
              content: result,
            });
          }
        }

        // Final streaming turn — no tools this time so the LLM commits to a text answer
        let fullText = "";
        for await (const delta of chatCompletionStream(messages, {
          temperature: 0.4,
          maxTokens: 700,
        })) {
          fullText += delta;
          send({ type: "token", text: delta });
        }

        if (!fullText.trim()) {
          fullText = "I couldn't produce an answer this time. Please rephrase.";
          send({ type: "token", text: fullText });
        }

        const asstMsg = await ChatMessage.create({
          userId: session.sub,
          sessionId: sessionOid,
          role: "assistant",
          content: fullText,
        });
        await ChatSession.updateOne(
          { _id: sessionOid },
          { $set: { lastMessageAt: new Date() } }
        ).exec();

        send({
          type: "done",
          message: {
            id: asstMsg._id.toString(),
            role: "assistant",
            content: fullText,
            createdAt: asstMsg.createdAt,
          },
        });
      } catch (err) {
        console.error("[chat] stream error", err);
        send({
          type: "error",
          error: err instanceof Error ? err.message : "Chat failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
