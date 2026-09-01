// Minimal Groq client — OpenAI-compatible chat completions + Whisper STT.
// Free tier, no SDK dependency (fetch only).

const GROQ_BASE = "https://api.groq.com/openai/v1";

export type ChatRole = "system" | "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

export const CHAT_MODEL = "llama-3.3-70b-versatile"; // fast + multilingual
export const CHAT_MODEL_FALLBACK = "llama-3.1-8b-instant";
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
  language?: "en" | "hi" | "pa"
): Promise<string> {
  const fd = new FormData();
  fd.append("file", new Blob([buffer]), filename);
  fd.append("model", STT_MODEL);
  fd.append("response_format", "text");
  if (language && language !== "pa") fd.append("language", language);
  // Whisper doesn't have a "pa" code, but usually understands Punjabi as Hindi.
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
