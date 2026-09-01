"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n/I18nProvider";
import { Card } from "@/components/ui/Card";
import {
  Mic,
  Square,
  Send,
  Trash2,
  Volume2,
  Loader2,
  Sparkles,
  Languages,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  CHAT_LANGUAGES,
  findLanguage,
  type ChatLangCode,
} from "@/lib/languages";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type ReadAloudMode = "ask" | "always" | "never";
type ChatPrefs = { readAloud: ReadAloudMode; chatLanguage?: ChatLangCode };

const SUGGESTIONS: Partial<Record<ChatLangCode, string[]>> = {
  en: [
    "Is today good for spraying?",
    "Best price for wheat today?",
    "Which govt scheme fits me?",
    "How much urea for my wheat crop?",
  ],
  hi: [
    "क्या आज स्प्रे के लिए ठीक है?",
    "आज गेहूँ का सबसे अच्छा भाव?",
    "मेरे लिए कौन-सी योजना है?",
    "मेरे गेहूँ के खेत में कितनी यूरिया डालूँ?",
  ],
  pa: [
    "ਕੀ ਅੱਜ ਸਪਰੇਅ ਲਈ ਠੀਕ ਹੈ?",
    "ਅੱਜ ਕਣਕ ਦਾ ਵਧੀਆ ਭਾਅ?",
    "ਮੇਰੇ ਲਈ ਕਿਹੜੀ ਸਕੀਮ ਹੈ?",
    "ਮੇਰੀ ਕਣਕ ਲਈ ਕਿੰਨੀ ਯੂਰੀਆ?",
  ],
};

export default function AskPage() {
  const { locale, t } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatLang, setChatLang] = useState<ChatLangCode>(locale as ChatLangCode);
  const [prefs, setPrefs] = useState<ChatPrefs>({ readAloud: "ask" });
  const [showSettings, setShowSettings] = useState(false);
  const [showLangs, setShowLangs] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Load user prefs + history
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.chatPrefs) {
          setPrefs({
            readAloud: d.user.chatPrefs.readAloud ?? "ask",
            chatLanguage: d.user.chatPrefs.chatLanguage,
          });
          if (d.user.chatPrefs.chatLanguage) {
            setChatLang(d.user.chatPrefs.chatLanguage);
          }
        }
      });
    fetch("/api/chat/history")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.messages)) setMessages(d.messages);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  async function saveReadAloud(mode: ReadAloudMode) {
    setPrefs((p) => ({ ...p, readAloud: mode }));
    await fetch("/api/user/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ readAloud: mode }),
    });
  }

  async function saveChatLanguage(code: ChatLangCode, makeDefault: boolean) {
    setChatLang(code);
    setShowLangs(false);
    if (makeDefault) {
      setPrefs((p) => ({ ...p, chatLanguage: code }));
      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatLanguage: code }),
      });
    }
  }

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || sending) return;
    setError(null);
    setSending(true);
    setMessages((m) => [
      ...m,
      { id: `tmp-${Date.now()}`, role: "user", content: msg },
    ]);
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, language: chatLang }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setMessages((m) => m.filter((x) => !x.id.startsWith("tmp-")));
        return;
      }
      setMessages((m) => [
        ...m.filter((x) => !x.id.startsWith("tmp-")),
        data.user,
        data.assistant,
      ]);
      if (prefs.readAloud === "always") speak(data.assistant.content);
    } catch {
      setError("Network error");
      setMessages((m) => m.filter((x) => !x.id.startsWith("tmp-")));
    } finally {
      setSending(false);
    }
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    const clean = text.replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = findLanguage(chatLang).bcp47;
    utter.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 1000) {
          setError("Recording too short — hold the mic longer");
          return;
        }
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("file", blob, "audio.webm");
          fd.append("language", chatLang);
          const res = await fetch("/api/stt", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || "Transcription failed");
          } else if (data.text) {
            send(data.text);
          }
        } catch {
          setError("Transcription failed");
        } finally {
          setTranscribing(false);
        }
      };
      mediaRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied");
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    mediaRef.current = null;
    setRecording(false);
  }

  async function clearChat() {
    if (!confirm("Clear all chat history?")) return;
    await fetch("/api/chat/history", { method: "DELETE" });
    setMessages([]);
    window.speechSynthesis?.cancel();
  }

  const suggestions = SUGGESTIONS[chatLang] ?? SUGGESTIONS.en!;
  const currentLang = findLanguage(chatLang);
  const showReadButton = prefs.readAloud !== "never";

  return (
    <div className="max-w-md mx-auto pt-4 flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between px-5 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-primary" />
          <h1 className="text-xl font-bold">Ask KrishiMitra</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="text-brand-mute hover:text-brand-ink p-1.5 rounded-full"
            aria-label="Chat settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-brand-mute hover:text-brand-danger p-1.5 rounded-full"
              aria-label="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Language chip */}
      <div className="px-5 mb-2 relative">
        <button
          onClick={() => setShowLangs((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 rounded-full px-3 py-1.5 hover:bg-brand-primary/15"
        >
          <Languages className="w-3.5 h-3.5" />
          {currentLang.nativeName} · {currentLang.name}
        </button>
        {showLangs && (
          <LanguagePicker
            current={chatLang}
            defaultLang={prefs.chatLanguage}
            onPick={saveChatLanguage}
            onClose={() => setShowLangs(false)}
          />
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="px-5 mb-3">
          <Card>
            <p className="text-xs uppercase tracking-wide text-brand-mute mb-2">
              Read aloud
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["ask", "always", "never"] as ReadAloudMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => saveReadAloud(m)}
                  className={cn(
                    "h-10 rounded-lg text-sm capitalize transition",
                    prefs.readAloud === m
                      ? "bg-brand-primary text-white font-semibold"
                      : "bg-brand-bg border border-brand-line text-brand-ink"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="text-xs text-brand-mute mt-2">
              {prefs.readAloud === "ask" &&
                "A speaker button appears under each reply."}
              {prefs.readAloud === "always" &&
                "Every reply is spoken automatically."}
              {prefs.readAloud === "never" && "Replies stay silent."}
            </p>
          </Card>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 space-y-3 pb-4"
      >
        {messages.length === 0 && (
          <Card className="text-center py-8">
            <Sparkles className="w-10 h-10 mx-auto text-brand-primary/70" />
            <p className="mt-3 font-semibold">Ask anything about your farm</p>
            <p className="text-xs text-brand-mute mt-1">
              Weather, prices, schemes, crop advice — in your language.
            </p>
            <div className="mt-5 grid gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm px-3 py-2 rounded-xl border border-brand-line bg-brand-bg hover:bg-brand-line/40 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed",
                m.role === "user"
                  ? "bg-brand-primary text-white rounded-br-sm"
                  : "bg-white border border-brand-line rounded-bl-sm"
              )}
            >
              {m.content}
              {m.role === "assistant" && showReadButton && (
                <button
                  onClick={() => speak(m.content)}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-brand-primary font-semibold"
                  aria-label="Read aloud"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {prefs.readAloud === "always" ? "Read again" : "Read this?"}
                </button>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="bg-white border border-brand-line rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
            </div>
          </div>
        )}

        {error && (
          <div className="text-center text-xs text-brand-danger bg-brand-danger/10 rounded-lg py-2 px-3">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-brand-line bg-brand-surface px-3 py-3 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={recording ? stopRecording : startRecording}
          disabled={transcribing || sending}
          className={cn(
            "w-11 h-11 shrink-0 rounded-full grid place-items-center transition",
            recording
              ? "bg-brand-danger text-white animate-pulse"
              : transcribing
                ? "bg-brand-line text-brand-mute"
                : "bg-brand-primary text-white hover:bg-brand-primary-hover"
          )}
          aria-label={recording ? "Stop recording" : "Start recording"}
        >
          {transcribing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : recording ? (
            <Square className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            recording
              ? "Recording…"
              : transcribing
                ? "Transcribing…"
                : t("dashboard.ask_placeholder")
          }
          disabled={recording || transcribing || sending}
          className="flex-1 h-11 px-4 rounded-full bg-brand-bg border border-brand-line focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending || recording || transcribing}
          className={cn(
            "w-11 h-11 shrink-0 rounded-full grid place-items-center transition",
            "bg-brand-primary text-white hover:bg-brand-primary-hover",
            "disabled:opacity-40 disabled:pointer-events-none"
          )}
          aria-label="Send"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

function LanguagePicker({
  current,
  defaultLang,
  onPick,
  onClose,
}: {
  current: ChatLangCode;
  defaultLang?: ChatLangCode;
  onPick: (code: ChatLangCode, makeDefault: boolean) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute left-5 right-5 top-full mt-1 z-40 bg-white border border-brand-line rounded-xl shadow-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-brand-line text-xs uppercase tracking-wide text-brand-mute">
          Chat language
        </div>
        <ul className="max-h-80 overflow-y-auto">
          {CHAT_LANGUAGES.map((l) => {
            const active = l.code === current;
            const isDefault = l.code === defaultLang;
            return (
              <li key={l.code}>
                <div className="flex items-center border-b border-brand-line last:border-b-0">
                  <button
                    onClick={() => onPick(l.code, false)}
                    className={cn(
                      "flex-1 text-left px-4 py-2.5 text-sm hover:bg-brand-line/30",
                      active && "bg-brand-primary/10 text-brand-primary font-semibold"
                    )}
                  >
                    <span className="mr-2">{l.nativeName}</span>
                    <span className="text-xs text-brand-mute">{l.name}</span>
                    {isDefault && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-brand-primary">
                        default
                      </span>
                    )}
                  </button>
                  {!isDefault && (
                    <button
                      onClick={() => onPick(l.code, true)}
                      className="text-[10px] uppercase tracking-wide text-brand-mute hover:text-brand-primary px-3 py-2 whitespace-nowrap"
                      title="Make default for future chats"
                    >
                      set default
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
