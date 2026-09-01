import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { transcribeAudio } from "@/lib/groq";
import { findLanguage } from "@/lib/languages";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 503 });
  }

  const ct = req.headers.get("content-type") || "";
  if (!ct.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Send audio as multipart/form-data with field 'file'" },
      { status: 400 }
    );
  }
  const form = await req.formData();
  const file = form.get("file");
  const langRaw = form.get("language");
  const whisperCode =
    typeof langRaw === "string" ? findLanguage(langRaw).whisper : undefined;

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio too large (max 5 MB)" }, { status: 413 });
  }
  const buf = await file.arrayBuffer();
  const name =
    (file as File).name || `audio.${(file.type.split("/")[1] || "webm").split(";")[0]}`;

  try {
    const text = await transcribeAudio(buf, name, whisperCode);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("[stt] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "STT failed" },
      { status: 502 }
    );
  }
}
