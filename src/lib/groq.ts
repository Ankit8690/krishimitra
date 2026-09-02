// Minimal Groq client — OpenAI-compatible chat completions + Whisper STT.
// Free tier, no SDK dependency (fetch only).

const GROQ_BASE = "https://api.groq.com/openai/v1";

export type ChatRole = "system" | "user" | "assistant" | "tool";
export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};
export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; content: string; tool_call_id: string };

export type Tool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ChatResponse = {
  content: string | null;
  toolCalls?: ToolCall[];
};

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
  opts: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    tools?: Tool[];
  } = {}
): Promise<ChatResponse> {
  const model = opts.model ?? CHAT_MODEL;
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 800,
  };
  if (opts.tools && opts.tools.length > 0) {
    body.tools = opts.tools;
    body.tool_choice = "auto";
  }

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    if (
      (res.status === 429 || res.status >= 500) &&
      model !== CHAT_MODEL_FALLBACK
    ) {
      console.warn(`[groq] ${model} failed ${res.status}, retrying with fallback`);
      return chatCompletion(messages, { ...opts, model: CHAT_MODEL_FALLBACK });
    }
    throw new Error(`Groq chat error ${res.status}: ${err.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices: {
      message: {
        content: string | null;
        tool_calls?: ToolCall[];
      };
    }[];
  };
  const msg = json.choices[0]?.message;
  return {
    content: msg?.content ?? null,
    toolCalls: msg?.tool_calls,
  };
}

/**
 * Stream a chat completion, yielding text deltas as they arrive.
 * Does NOT support tools — call chatCompletion first if you need those, then
 * stream the final turn.
 */
export async function* chatCompletionStream(
  messages: ChatMessage[],
  opts: { model?: string; temperature?: number; maxTokens?: number } = {}
): AsyncGenerator<string, void, unknown> {
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
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    const err = await res.text().catch(() => "");
    if (
      (res.status === 429 || res.status >= 500) &&
      model !== CHAT_MODEL_FALLBACK
    ) {
      console.warn(`[groq stream] ${model} failed ${res.status}, retrying with fallback`);
      yield* chatCompletionStream(messages, { ...opts, model: CHAT_MODEL_FALLBACK });
      return;
    }
    throw new Error(`Groq stream error ${res.status}: ${err.slice(0, 200)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let sep;
    while ((sep = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, sep).trim();
      buffer = buffer.slice(sep + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;
      try {
        const json = JSON.parse(payload) as {
          choices?: { delta?: { content?: string } }[];
        };
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // Ignore malformed chunk, keep going
      }
    }
  }
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
