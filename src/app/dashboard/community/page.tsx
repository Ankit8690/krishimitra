"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import {
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  Phone,
  MapPin,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { inr } from "@/lib/format";

const TYPES = [
  { key: "equipment", label: "Equipment" },
  { key: "seed", label: "Seed" },
  { key: "labour", label: "Labour" },
  { key: "produce", label: "Produce" },
  { key: "other", label: "Other" },
] as const;
type PostType = (typeof TYPES)[number]["key"];

type Post = {
  id: string;
  type: PostType;
  title: string;
  body: string;
  contact: string | null;
  priceInr: number | null;
  author: string;
  state: string | null;
  district: string | null;
  createdAt: string;
  isMine: boolean;
};

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [filter, setFilter] = useState<PostType | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: "equipment" as PostType,
    title: "",
    body: "",
    contact: "",
    priceInr: "",
  });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    load();
  }, [filter]);

  async function load() {
    setPosts(null);
    const qs = filter === "all" ? "" : `?type=${filter}`;
    const r = await fetch(`/api/community${qs}`);
    const d = await r.json();
    setPosts(d.posts ?? []);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        type: form.type,
        title: form.title,
        body: form.body,
      };
      if (form.contact) body.contact = form.contact;
      if (form.priceInr) body.priceInr = Number(form.priceInr);
      const r = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Could not post");
        return;
      }
      setShowForm(false);
      setForm({ type: "equipment", title: "", body: "", contact: "", priceInr: "" });
      load();
    } finally {
      setPosting(false);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/community/${id}`, { method: "DELETE" });
    setPosts((p) => p?.filter((x) => x.id !== id) ?? null);
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-brand-line/40">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Users className="w-5 h-5 text-brand-primary" />
        <h1 className="text-xl font-bold">Community board</h1>
        <button
          onClick={() => setShowForm(true)}
          className="ml-auto w-9 h-9 rounded-full bg-brand-primary text-white grid place-items-center hover:bg-brand-primary-hover"
          aria-label="New post"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-3 flex gap-1.5 flex-wrap">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </FilterChip>
        {TYPES.map((t) => (
          <FilterChip
            key={t.key}
            active={filter === t.key}
            onClick={() => setFilter(t.key)}
          >
            {t.label}
          </FilterChip>
        ))}
      </div>

      {!posts && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-brand-line/40 animate-pulse" />
          ))}
        </div>
      )}

      {posts && posts.length === 0 && (
        <Card className="text-center text-brand-mute py-10">
          <Users className="w-10 h-10 mx-auto text-brand-primary/50" />
          <p className="mt-3">No posts yet in this category.</p>
          <p className="text-xs mt-1">Be the first — tap ➕ above.</p>
        </Card>
      )}

      <div className="space-y-3">
        {posts?.map((p) => (
          <Card key={p.id} className="p-0 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full",
                    typeStyle(p.type)
                  )}
                >
                  {TYPES.find((t) => t.key === p.type)?.label ?? p.type}
                </span>
                {p.priceInr != null && (
                  <span className="font-bold text-brand-primary">
                    {inr(p.priceInr)}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-base">{p.title}</h3>
              <p className="text-sm text-brand-ink mt-1 whitespace-pre-wrap">
                {p.body}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-brand-mute">
                <span>By {p.author}</span>
                {p.district && (
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />
                    {p.district}
                    {p.state && `, ${p.state}`}
                  </span>
                )}
                {p.contact && (
                  <a
                    href={`tel:${p.contact}`}
                    className="inline-flex items-center gap-1 text-brand-primary font-semibold"
                  >
                    <Phone className="w-3 h-3" />
                    {p.contact}
                  </a>
                )}
              </div>
            </div>
            {p.isMine && (
              <button
                onClick={() => del(p.id)}
                className="w-full py-2 text-xs text-brand-danger border-t border-brand-line hover:bg-brand-danger/5"
              >
                Delete my post
              </button>
            )}
          </Card>
        ))}
      </div>

      {showForm && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/40"
            onClick={() => setShowForm(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-40 max-w-md mx-auto bg-brand-surface rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto pb-safe">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg">New post</h2>
              <button
                onClick={() => setShowForm(false)}
                aria-label="Close"
                className="p-1.5 rounded-full hover:bg-brand-line/40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <Label>Category</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TYPES.map((t) => (
                    <button
                      type="button"
                      key={t.key}
                      onClick={() => setForm({ ...form, type: t.key })}
                      className={cn(
                        "h-10 rounded-lg text-sm border",
                        form.type === t.key
                          ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-semibold"
                          : "border-brand-line bg-white"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Tractor for rent, ₹800/day"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <Label>Details</Label>
                <textarea
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Describe what you're offering / asking for"
                  required
                  minLength={3}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-brand-line focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Price ₹ (optional)</Label>
                  <Input
                    type="number"
                    value={form.priceInr}
                    onChange={(e) => setForm({ ...form, priceInr: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Contact (phone)</Label>
                  <Input
                    type="tel"
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    placeholder="Uses your saved number if empty"
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm text-brand-danger bg-brand-danger/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <Button size="lg" className="w-full" disabled={posting}>
                {posting ? "Posting…" : "Post to community"}
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-xs font-semibold px-3 py-1.5 rounded-full border transition",
        active
          ? "bg-brand-primary text-white border-brand-primary"
          : "bg-white border-brand-line text-brand-ink hover:bg-brand-line/40"
      )}
    >
      {children}
    </button>
  );
}

function typeStyle(t: PostType): string {
  switch (t) {
    case "equipment":
      return "bg-blue-50 text-blue-700";
    case "seed":
      return "bg-green-50 text-green-700";
    case "labour":
      return "bg-orange-50 text-orange-700";
    case "produce":
      return "bg-purple-50 text-purple-700";
    default:
      return "bg-brand-line text-brand-mute";
  }
}
