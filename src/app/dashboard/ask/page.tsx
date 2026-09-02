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
  Play,
  Pause,
  RotateCcw,
  Plus,
  MessageSquare,
  X,
  Copy,
  Share2,
  FileDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  CHAT_LANGUAGES,
  findLanguage,
  type ChatLangCode,
} from "@/lib/languages";
import { ChatMarkdown } from "@/components/ChatMarkdown";
import { exportChatAsPdf } from "@/lib/exportPdf";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type ReadAloudMode = "ask" | "always" | "never";
type ChatPrefs = { readAloud: ReadAloudMode; chatLanguage?: ChatLangCode };
type Session = {
  id: string;
  title: string;
  lastMessageAt: string;
  preview: string;
  messageCount: number;
};

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
  const [availableVoiceLangs, setAvailableVoiceLangs] = useState<Set<string>>(new Set());
  const [voiceMissingNote, setVoiceMissingNote] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speakingPaused, setSpeakingPaused] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Detect installed TTS voices (updates when OS voices load asynchronously)
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const refresh = () => {
      const langs = new Set(
        window.speechSynthesis.getVoices().map((v) => v.lang.toLowerCase())
      );
      setAvailableVoiceLangs(langs);
    };
    refresh();
    window.speechSynthesis.addEventListener("voiceschanged", refresh);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", refresh);
  }, []);

  function hasVoiceForLang(bcp47: string): boolean {
    const lower = bcp47.toLowerCase();
    const base = lower.split("-")[0];
    for (const v of availableVoiceLangs) {
      if (v === lower || v.split("-")[0] === base) return true;
    }
    return false;
  }

  // Load user prefs + history
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.name) setUserName(d.user.name);
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
    loadHistory();
    loadSessions();
  }, []);

  async function loadHistory(id?: string) {
    const qs = id ? `?sessionId=${id}` : "";
    const r = await fetch(`/api/chat/history${qs}`);
    const d = await r.json();
    if (d.sessionId) setSessionId(d.sessionId);
    if (Array.isArray(d.messages)) setMessages(d.messages);
    stopSpeaking();
  }

  async function loadSessions() {
    try {
      const r = await fetch("/api/chat/sessions");
      const d = await r.json();
      if (Array.isArray(d.sessions)) setSessions(d.sessions);
    } catch {}
  }

  async function startNewSession() {
    stopSpeaking();
    const r = await fetch("/api/chat/sessions", { method: "POST" });
    const d = await r.json();
    if (d.id) {
      setSessionId(d.id);
      setMessages([]);
      setShowSessions(false);
      loadSessions();
    }
  }

  async function switchSession(id: string) {
    setShowSessions(false);
    await loadHistory(id);
  }

  async function deleteSession(id: string) {
    if (!confirm("Delete this chat?")) return;
    await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
    if (id === sessionId) {
      setSessionId(null);
      setMessages([]);
    }
    loadSessions();
  }

  async function copyMessage(id: string, content: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId((cur) => (cur === id ? null : cur)), 1500);
    } catch {
      setError("Could not copy to clipboard");
    }
  }

  async function shareMessage(content: string) {
    const text = `${content}\n\n— from KrishiMitra`;
    if (navigator.share) {
      try {
        await navigator.share({ text, title: "KrishiMitra reply" });
      } catch (e) {
        // User cancelled — ignore
        if ((e as DOMException)?.name !== "AbortError") {
          setError("Could not open share sheet");
        }
      }
      return;
    }
    // Desktop fallback: WhatsApp Web
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  async function exportChat() {
    if (messages.length === 0) {
      setError("Nothing to export in this chat yet");
      return;
    }
    setExporting(true);
    setError(null);
    try {
      const currentSession = sessions.find((s) => s.id === sessionId);
      const title = currentSession?.title ?? "Chat";
      await exportChatAsPdf(title, userName || "Farmer", messages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setExporting(false);
    }
  }

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
        body: JSON.stringify({
          message: msg,
          language: chatLang,
          sessionId: sessionId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        setMessages((m) => m.filter((x) => !x.id.startsWith("tmp-")));
        return;
      }
      if (data.sessionId) setSessionId(data.sessionId);
      setMessages((m) => [
        ...m.filter((x) => !x.id.startsWith("tmp-")),
        data.user,
        data.assistant,
      ]);
      if (prefs.readAloud === "always" && hasVoiceForLang(findLanguage(chatLang).bcp47)) {
        speak(data.assistant.id, data.assistant.content);
      }
      loadSessions(); // refresh preview + title after first message
    } catch {
      setError("Network error");
      setMessages((m) => m.filter((x) => !x.id.startsWith("tmp-")));
    } finally {
      setSending(false);
    }
  }

  function stopSpeaking() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeakingId(null);
    setSpeakingPaused(false);
  }

  function togglePauseResume() {
    if (!("speechSynthesis" in window)) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setSpeakingPaused(false);
    } else if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setSpeakingPaused(true);
    }
  }

  function speak(id: string, text: string) {
    if (!("speechSynthesis" in window)) return;
    const lang = findLanguage(chatLang);
    if (!hasVoiceForLang(lang.bcp47)) {
      setVoiceMissingNote(
        `No ${lang.name} voice installed on this device. To enable it: Windows Settings → Time & Language → Speech → Add voices → search "${lang.name}".`
      );
      setTimeout(() => setVoiceMissingNote(null), 8000);
      return;
    }
    // Always start fresh — cancel anything currently playing
    window.speechSynthesis.cancel();

    const clean = text.replace(/[*_`#>]/g, "").replace(/\s+/g, " ").trim();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = lang.bcp47;
    utter.rate = 0.95;
    const voice = window.speechSynthesis
      .getVoices()
      .find(
        (v) =>
          v.lang.toLowerCase() === lang.bcp47.toLowerCase() ||
          v.lang.toLowerCase().startsWith(lang.code)
      );
    if (voice) utter.voice = voice;

    utter.onstart = () => {
      setSpeakingId(id);
      setSpeakingPaused(false);
    };
    utter.onend = () => {
      setSpeakingId((cur) => (cur === id ? null : cur));
      setSpeakingPaused(false);
    };
    utter.onerror = utter.onend;

    window.speechSynthesis.speak(utter);
  }

  // Stop any playback when the page unmounts
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

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


  const suggestions = SUGGESTIONS[chatLang] ?? SUGGESTIONS.en!;
  const currentLang = findLanguage(chatLang);
  const showReadButton = prefs.readAloud !== "never";
  const currentVoiceOk = hasVoiceForLang(currentLang.bcp47);

  return (
    <div className="max-w-md mx-auto pt-4 flex flex-col h-[calc(100vh-4rem)] relative">
      {showSessions && (
        <SessionsPanel
          sessions={sessions}
          currentId={sessionId}
          onClose={() => setShowSessions(false)}
          onPick={switchSession}
          onDelete={deleteSession}
          onNew={startNewSession}
        />
      )}
      <div className="flex items-center justify-between px-5 mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSessions(true)}
            className="text-brand-mute hover:text-brand-ink p-1.5 -ml-1.5 rounded-full"
            aria-label="Chat history"
            title="Past chats"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <Sparkles className="w-5 h-5 text-brand-primary" />
          <h1 className="text-xl font-bold">Ask KrishiMitra</h1>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={exportChat}
              disabled={exporting}
              className="text-brand-mute hover:text-brand-primary p-1.5 rounded-full disabled:opacity-50"
              aria-label="Export chat as PDF"
              title="Export chat as PDF"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={startNewSession}
            className="text-brand-mute hover:text-brand-primary p-1.5 rounded-full"
            aria-label="New chat"
            title="New chat"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings((s) => !s)}
            className="text-brand-mute hover:text-brand-ink p-1.5 rounded-full"
            aria-label="Chat settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Language chip */}
      <div className="px-5 mb-2 relative flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowLangs((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-primary bg-brand-primary/10 rounded-full px-3 py-1.5 hover:bg-brand-primary/15"
        >
          <Languages className="w-3.5 h-3.5" />
          {currentLang.nativeName} · {currentLang.name}
        </button>
        {!currentVoiceOk && prefs.readAloud !== "never" && (
          <span
            className="text-[10px] text-brand-mute inline-flex items-center gap-1"
            title="No TTS voice installed for this language"
          >
            🔇 no {currentLang.name} voice
          </span>
        )}
        {showLangs && (
          <LanguagePicker
            current={chatLang}
            defaultLang={prefs.chatLanguage}
            availableVoiceLangs={availableVoiceLangs}
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

        {messages.map((m) => {
          const isAssistant = m.role === "assistant";
          const active = speakingId === m.id;
          return (
            <div key={m.id} className="space-y-1.5">
              <div
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-3.5 py-2.5 rounded-2xl leading-relaxed",
                    m.role === "user"
                      ? "bg-brand-primary text-white rounded-br-sm text-sm whitespace-pre-wrap"
                      : "bg-white border border-brand-line rounded-bl-sm text-brand-ink"
                  )}
                >
                  {isAssistant ? (
                    <ChatMarkdown>{m.content}</ChatMarkdown>
                  ) : (
                    m.content
                  )}
                </div>
              </div>

              {isAssistant && (
                <div className="flex justify-center items-center gap-2 flex-wrap">
                  {active ? (
                    <>
                      <IconAction
                        onClick={togglePauseResume}
                        label={speakingPaused ? "Resume" : "Pause"}
                        variant="active"
                      >
                        {speakingPaused ? (
                          <Play className="w-4 h-4" />
                        ) : (
                          <Pause className="w-4 h-4" />
                        )}
                      </IconAction>
                      <IconAction
                        onClick={() => speak(m.id, m.content)}
                        label="Restart from beginning"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </IconAction>
                      <IconAction
                        onClick={stopSpeaking}
                        label="Stop"
                        variant="danger"
                      >
                        <Square className="w-3.5 h-3.5" />
                      </IconAction>
                    </>
                  ) : (
                    <>
                      {showReadButton && (
                        <IconAction
                          onClick={() => speak(m.id, m.content)}
                          label="Read aloud"
                        >
                          <Volume2 className="w-4 h-4" />
                        </IconAction>
                      )}
                      <IconAction
                        onClick={() => copyMessage(m.id, m.content)}
                        label={copiedId === m.id ? "Copied" : "Copy text"}
                        variant={copiedId === m.id ? "active" : "idle"}
                      >
                        {copiedId === m.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </IconAction>
                      <IconAction
                        onClick={() => shareMessage(m.content)}
                        label="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </IconAction>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

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
        {voiceMissingNote && (
          <div className="text-xs text-brand-ink bg-brand-accent/10 border border-brand-accent/40 rounded-lg py-2 px-3">
            {voiceMissingNote}
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

function SessionsPanel({
  sessions,
  currentId,
  onClose,
  onPick,
  onDelete,
  onNew,
}: {
  sessions: Session[];
  currentId: string | null;
  onClose: () => void;
  onPick: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="absolute left-0 right-0 top-0 z-40 max-w-md mx-auto bg-brand-bg border border-brand-line rounded-b-2xl shadow-xl max-h-[80vh] flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 border-b border-brand-line">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-primary" />
            <h2 className="font-semibold">Past chats</h2>
            <span className="text-xs text-brand-mute">{sessions.length}/10</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full hover:bg-brand-line/40"
          >
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="p-3">
          <button
            onClick={onNew}
            className="w-full h-11 rounded-xl bg-brand-primary text-white font-semibold flex items-center justify-center gap-2 hover:bg-brand-primary-hover"
          >
            <Plus className="w-4 h-4" /> New chat
          </button>
        </div>
        <ul className="overflow-y-auto flex-1 divide-y divide-brand-line">
          {sessions.length === 0 && (
            <li className="px-4 py-6 text-sm text-brand-mute text-center">
              No past chats yet.
            </li>
          )}
          {sessions.map((s) => {
            const active = s.id === currentId;
            return (
              <li
                key={s.id}
                className={cn(
                  "flex items-start gap-2 px-3 py-3",
                  active && "bg-brand-primary/5"
                )}
              >
                <button
                  onClick={() => onPick(s.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p
                    className={cn(
                      "text-sm truncate",
                      active ? "font-semibold text-brand-primary" : "font-medium"
                    )}
                  >
                    {s.title}
                  </p>
                  {s.preview && (
                    <p className="text-xs text-brand-mute truncate mt-0.5">
                      {s.preview}
                    </p>
                  )}
                  <p className="text-[10px] text-brand-mute mt-1">
                    {s.messageCount} msg · {relTime(s.lastMessageAt)}
                  </p>
                </button>
                <button
                  onClick={() => onDelete(s.id)}
                  aria-label="Delete chat"
                  className="p-1.5 rounded-full text-brand-mute hover:text-brand-danger hover:bg-brand-danger/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, (Date.now() - then) / 1000);
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days < 7) return `${days} d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function IconAction({
  children,
  label,
  onClick,
  disabled,
  variant = "idle",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "idle" | "active" | "danger";
}) {
  const styles: Record<typeof variant, string> = {
    idle: "bg-white border-brand-line text-brand-primary hover:bg-brand-primary hover:text-white hover:border-brand-primary",
    active:
      "bg-brand-primary text-white border-brand-primary hover:bg-brand-primary-hover",
    danger:
      "bg-white border-brand-line text-brand-danger hover:bg-brand-danger hover:text-white hover:border-brand-danger",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "w-9 h-9 grid place-items-center rounded-full border shadow-sm transition active:scale-95",
        "disabled:opacity-40 disabled:pointer-events-none",
        styles[variant]
      )}
    >
      {children}
    </button>
  );
}

function LanguagePicker({
  current,
  defaultLang,
  availableVoiceLangs,
  onPick,
  onClose,
}: {
  current: ChatLangCode;
  defaultLang?: ChatLangCode;
  availableVoiceLangs: Set<string>;
  onPick: (code: ChatLangCode, makeDefault: boolean) => void;
  onClose: () => void;
}) {
  const hasVoice = (bcp: string) => {
    const l = bcp.toLowerCase();
    const b = l.split("-")[0];
    for (const v of availableVoiceLangs) {
      if (v === l || v.split("-")[0] === b) return true;
    }
    return false;
  };
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
                    {!hasVoice(l.bcp47) && (
                      <span
                        className="ml-2 text-[10px] text-brand-mute"
                        title="No text-to-speech voice installed for this language"
                      >
                        🔇 text only
                      </span>
                    )}
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
