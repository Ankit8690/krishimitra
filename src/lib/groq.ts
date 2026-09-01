// Minimal Groq client — OpenAI-compatible chat completions + Whisper STT.
// Free tier, no SDK dependency (fetch only).

const GROQ_BASE = "https://api.groq.com/openai/v1";

export type ChatRole = "system" | "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

// Groq's 2026 roster — Llama removed, replaced by OpenAI's gpt-oss + Qwen.
// gpt-oss-120b is highest quality; gpt-oss-20b is a fast fallback.
export const CHAT_MODEL = "openai/gpt-oss-120b";
export const CHAT_MODEL_FALLBACK = "openai/gpt-oss-20b";
export const STT_MODEL = "whisper-large-v3-turbo";

function key(): string {
  const k = process.env.GROQ_API_KEY;
  if (!k) throw new Error("GROQ_API_KEY is not set");
  return k;
}

export async function chatCompletion(
  messages: ChatMessage[],
  opts: { model?: string; temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  const model = opts.model ?? CHAT_MODEL;
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.4,
      max_tokens: opts.maxTokens ?? 800,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    // Auto-fall-back to the smaller model if the big one is rate-limited or down
    if (
      (res.status === 429 || res.status >= 500) &&
      model !== CHAT_MODEL_FALLBACK
    ) {
      console.warn(`[groq] ${model} failed ${res.status}, retrying with fallback`);
      return chatCompletion(messages, { ...opts, model: CHAT_MODEL_FALLBACK });
    }
    throw new Error(`Groq chat error ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return json.choices[0]?.message?.content ?? "";
}

export async function transcribeAudio(
  buffer: ArrayBuffer,
  filename: string,
  whisperCode?: string | null
): Promise<string> {
  const fd = new FormData();
  fd.append("file", new Blob([buffer]), filename);
  fd.append("model", STT_MODEL);
  fd.append("response_format", "text");
  if (whisperCode) fd.append("language", whisperCode);
  // If code is null (Odia, Assamese) let Whisper auto-detect.
  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}` },
    body: fd,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq STT error ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.text()).trim();
}
