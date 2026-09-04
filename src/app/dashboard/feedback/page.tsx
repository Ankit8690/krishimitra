"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquareHeart, Send, Star, Bug, Lightbulb, Heart, Sparkles, HelpCircle, CheckCircle2, Clock } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

type Category = "bug" | "suggestion" | "praise" | "feature" | "other";
type MyItem = {
  id: string;
  category: Category;
  rating: number;
  message: string;
  status: string;
  createdAt: string;
};

const CATEGORY_META: Record<Category, { label: string; hint: string; icon: React.ReactNode; color: string }> = {
  bug: { label: "Bug", hint: "Something broken", icon: <Bug className="w-4 h-4" />, color: "rose" },
  suggestion: { label: "Suggestion", hint: "Improvement idea", icon: <Lightbulb className="w-4 h-4" />, color: "amber" },
  feature: { label: "New feature", hint: "Request something new", icon: <Sparkles className="w-4 h-4" />, color: "violet" },
  praise: { label: "Praise", hint: "What you liked", icon: <Heart className="w-4 h-4" />, color: "emerald" },
  other: { label: "Other", hint: "Anything else", icon: <HelpCircle className="w-4 h-4" />, color: "slate" },
};

const CAT_COLORS: Record<string, string> = {
  rose: "border-rose-500 bg-rose-50 text-rose-700",
  amber: "border-amber-500 bg-amber-50 text-amber-700",
  violet: "border-violet-500 bg-violet-50 text-violet-700",
  emerald: "border-emerald-500 bg-emerald-50 text-emerald-700",
  slate: "border-slate-500 bg-slate-50 text-slate-700",
};

export default function FeedbackPage() {
  const [category, setCategory] = useState<Category>("suggestion");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [posting, setPosting] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState<MyItem[] | null>(null);

  async function load() {
    const r = await fetch("/api/feedback");
    const d = await r.json();
    setMine(d.items ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    setError(null);
    setOk(false);
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, rating, message, email }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Could not send");
      } else {
        setOk(true);
        setMessage("");
        setEmail("");
        setRating(5);
        setCategory("suggestion");
        load();
      }
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="km-page-wrapper km-narrow">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-brand-line/40">
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* Header block */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-pink-100 via-rose-50 to-white border-pink-200 mb-4">
        <div className="absolute -top-4 -right-4 text-7xl opacity-15 pointer-events-none select-none rotate-12">
          💬
        </div>
        <div className="relative flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 grid place-items-center shadow-md shrink-0">
            <MessageSquareHeart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Your feedback matters</h1>
            <p className="text-sm text-brand-mute mt-1">
              Help us improve KrishiMitra for every farmer in India. Report a bug, share an idea, or just tell us what you like.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <form onSubmit={submit} className="space-y-5">
          {/* Category */}
          <div>
            <Label>Category</Label>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(CATEGORY_META) as Category[]).map((k) => {
                const m = CATEGORY_META[k];
                const active = category === k;
                return (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setCategory(k)}
                    className={cn(
                      "text-left rounded-xl p-3 border-2 transition inline-flex items-start gap-2",
                      active
                        ? CAT_COLORS[m.color] + " shadow-md"
                        : "border-brand-line bg-white hover:border-brand-mute"
                    )}
                  >
                    <span className={cn("mt-0.5", active ? "" : "text-brand-mute")}>{m.icon}</span>
                    <span>
                      <p className="font-bold text-sm leading-none">{m.label}</p>
                      <p className="text-[11px] text-brand-mute mt-1 leading-tight">{m.hint}</p>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          <div>
            <Label>How would you rate KrishiMitra?</Label>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = (hoverRating || rating) >= n;
                return (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1"
                    aria-label={`${n} star`}
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 transition",
                        filled ? "fill-amber-400 text-amber-400" : "text-brand-line"
                      )}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-sm font-semibold text-brand-ink">{rating}/5</span>
            </div>
          </div>

          {/* Message */}
          <div>
            <Label>Your message</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what happened, what you'd like, or what worked well…"
              required
              minLength={5}
              maxLength={3000}
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-white border border-brand-line focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            />
            <p className="text-[11px] text-brand-mute mt-1 text-right">{message.length}/3000</p>
          </div>

          {/* Optional email */}
          <div>
            <Label>Reply-to email (optional)</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="If you want us to follow up"
            />
          </div>

          {error && (
            <p className="text-sm text-brand-danger bg-brand-danger/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {ok && (
            <p className="text-sm text-brand-primary bg-brand-primary/10 rounded-lg px-3 py-2 inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Thanks! Your feedback has been recorded.
            </p>
          )}

          <Button size="lg" className="w-full" disabled={posting}>
            <span className="inline-flex items-center gap-2">
              <Send className="w-4 h-4" /> {posting ? "Sending…" : "Send feedback"}
            </span>
          </Button>
        </form>
      </Card>

      {/* Past submissions */}
      {mine && mine.length > 0 && (
        <div className="mt-6">
          <CardTitle className="mb-2 px-1">Your past feedback</CardTitle>
          <div className="space-y-2">
            {mine.map((m) => {
              const meta = CATEGORY_META[m.category];
              return (
                <Card key={m.id} className="p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn("px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1", CAT_COLORS[meta.color])}>
                      {meta.icon} {meta.label}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {m.rating}
                    </span>
                    <span className="ml-auto text-brand-mute inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="text-sm mt-2 text-brand-ink line-clamp-3">{m.message}</p>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-brand-line text-brand-mute",
    read: "bg-sky-100 text-sky-700",
    in_progress: "bg-amber-100 text-amber-700",
    resolved: "bg-emerald-100 text-emerald-700",
    archived: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase", map[status] || "bg-brand-line")}>
      {status.replace("_", " ")}
    </span>
  );
}
