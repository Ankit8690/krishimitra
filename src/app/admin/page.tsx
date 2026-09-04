"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Star,
  Trash2,
  MessageSquare,
  Search,
  Save,
  X,
  Bug,
  Lightbulb,
  Heart,
  Sparkles,
  HelpCircle,
  Phone,
  MapPin,
  Mail,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

type Category = "bug" | "suggestion" | "praise" | "feature" | "other";
type Status = "new" | "read" | "in_progress" | "resolved" | "archived";

type Item = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  state: string | null;
  district: string | null;
  category: Category;
  rating: number;
  message: string;
  status: Status;
  starred: boolean;
  adminNote: string;
  createdAt: string;
  userId: string | null;
};

type Stats = {
  total: number;
  byStatus: Record<Status, number>;
  avgRating: number;
};

const STATUSES: Status[] = ["new", "read", "in_progress", "resolved", "archived"];
const CATEGORIES: Category[] = ["bug", "suggestion", "feature", "praise", "other"];

const CAT_ICON: Record<Category, React.ReactNode> = {
  bug: <Bug className="w-3 h-3" />,
  suggestion: <Lightbulb className="w-3 h-3" />,
  feature: <Sparkles className="w-3 h-3" />,
  praise: <Heart className="w-3 h-3" />,
  other: <HelpCircle className="w-3 h-3" />,
};

const CAT_COLOR: Record<Category, string> = {
  bug: "bg-rose-100 text-rose-700",
  suggestion: "bg-amber-100 text-amber-700",
  feature: "bg-violet-100 text-violet-700",
  praise: "bg-emerald-100 text-emerald-700",
  other: "bg-slate-100 text-slate-700",
};

const STATUS_COLOR: Record<Status, string> = {
  new: "bg-brand-primary text-white",
  read: "bg-sky-100 text-sky-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
  archived: "bg-slate-200 text-slate-600",
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [starredOnly, setStarredOnly] = useState(false);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (starredOnly) params.set("starred", "1");
    const r = await fetch(`/api/admin/feedback?${params}`);
    const d = await r.json();
    setItems(d.items ?? []);
    setStats(d.stats ?? null);
  }

  useEffect(() => {
    if (!loading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, starredOnly]);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const s = q.toLowerCase();
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(s) ||
        i.message.toLowerCase().includes(s) ||
        (i.email && i.email.toLowerCase().includes(s)) ||
        (i.district && i.district.toLowerCase().includes(s))
    );
  }, [items, q]);

  async function patchItem(id: string, patch: Partial<Pick<Item, "status" | "starred" | "adminNote">>) {
    setSavingId(id);
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    try {
      await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (patch.status || patch.starred !== undefined) load();
    } finally {
      setSavingId(null);
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this feedback permanently?")) return;
    await fetch(`/api/admin/feedback/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((x) => x.id !== id));
    load();
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-brand-mute">Loading admin…</div>
    );
  }

  return (
    <>
      <main className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatTile label="Total" value={stats.total} color="from-slate-500 to-slate-600" />
            <StatTile label="New" value={stats.byStatus.new || 0} color="from-emerald-500 to-teal-600" />
            <StatTile label="In progress" value={stats.byStatus.in_progress || 0} color="from-amber-500 to-orange-600" />
            <StatTile label="Resolved" value={stats.byStatus.resolved || 0} color="from-sky-500 to-blue-600" />
            <StatTile label="Avg rating" value={`${stats.avgRating} ★`} color="from-rose-500 to-pink-600" />
          </div>
        )}

        {/* Filters */}
        <Card className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-mute" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, message, email…"
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
              className="px-3 py-2 rounded-xl border border-brand-line bg-white text-sm"
            >
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as Category | "all")}
              className="px-3 py-2 rounded-xl border border-brand-line bg-white text-sm"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              onClick={() => setStarredOnly((v) => !v)}
              className={cn(
                "px-3 py-2 rounded-xl border text-sm font-semibold inline-flex items-center gap-1.5",
                starredOnly ? "bg-amber-100 border-amber-400 text-amber-700" : "bg-white border-brand-line"
              )}
            >
              <Star className={cn("w-4 h-4", starredOnly && "fill-amber-500 text-amber-500")} /> Starred
            </button>
          </div>
        </Card>

        {/* List */}
        {filtered.length === 0 ? (
          <Card className="text-center py-10 text-brand-mute">
            <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
            <p className="mt-2 text-sm">No feedback matches your filters.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((it) => {
              const open = openId === it.id;
              return (
                <Card key={it.id} className="p-0 overflow-hidden">
                  {/* Row header */}
                  <div className="p-4 flex items-start gap-3">
                    <button
                      onClick={() => patchItem(it.id, { starred: !it.starred })}
                      className="mt-0.5"
                      aria-label="Star"
                      disabled={savingId === it.id}
                    >
                      <Star
                        className={cn(
                          "w-5 h-5 transition",
                          it.starred ? "fill-amber-400 text-amber-400" : "text-brand-mute hover:text-amber-500"
                        )}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1", CAT_COLOR[it.category])}>
                          {CAT_ICON[it.category]} {it.category}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold text-sm">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {it.rating}
                        </span>
                        <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded-full", STATUS_COLOR[it.status])}>
                          {it.status.replace("_", " ")}
                        </span>
                        <span className="ml-auto text-xs text-brand-mute shrink-0">
                          {new Date(it.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-brand-mute">
                        <span className="font-semibold text-brand-ink">{it.name}</span>
                        {it.email && (
                          <a href={`mailto:${it.email}`} className="inline-flex items-center gap-0.5 hover:underline">
                            <Mail className="w-3 h-3" /> {it.email}
                          </a>
                        )}
                        {it.phone && (
                          <a href={`tel:${it.phone}`} className="inline-flex items-center gap-0.5 hover:underline">
                            <Phone className="w-3 h-3" /> {it.phone}
                          </a>
                        )}
                        {it.district && (
                          <span className="inline-flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" /> {it.district}
                            {it.state && `, ${it.state}`}
                          </span>
                        )}
                      </div>
                      <p className={cn("mt-2 text-sm text-brand-ink whitespace-pre-wrap", !open && "line-clamp-2")}>
                        {it.message}
                      </p>
                      <button
                        onClick={() => {
                          setOpenId(open ? null : it.id);
                          if (!open) setNoteDraft((n) => ({ ...n, [it.id]: it.adminNote }));
                          if (!open && it.status === "new") patchItem(it.id, { status: "read" });
                        }}
                        className="mt-1 text-xs text-brand-primary font-semibold"
                      >
                        {open ? "Collapse" : "Manage / view"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded management panel */}
                  {open && (
                    <div className="border-t border-brand-line bg-brand-bg/40 p-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-brand-mute uppercase mb-1.5">Status</p>
                        <div className="flex flex-wrap gap-1.5">
                          {STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={() => patchItem(it.id, { status: s })}
                              className={cn(
                                "text-xs font-semibold px-3 py-1 rounded-full border transition",
                                it.status === s
                                  ? STATUS_COLOR[s] + " border-transparent"
                                  : "bg-white border-brand-line hover:bg-brand-line/40"
                              )}
                            >
                              {s.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-brand-mute uppercase mb-1.5">Admin note (private)</p>
                        <textarea
                          value={noteDraft[it.id] ?? it.adminNote}
                          onChange={(e) => setNoteDraft((n) => ({ ...n, [it.id]: e.target.value }))}
                          rows={3}
                          maxLength={2000}
                          placeholder="Internal note — visible only to admins"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-brand-line focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-sm"
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            onClick={() => patchItem(it.id, { adminNote: noteDraft[it.id] ?? "" })}
                            disabled={savingId === it.id}
                          >
                            <span className="inline-flex items-center gap-1">
                              <Save className="w-3.5 h-3.5" /> Save note
                            </span>
                          </Button>
                          <button
                            onClick={() => del(it.id)}
                            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-brand-danger bg-brand-danger/10 hover:bg-brand-danger/20 px-3 py-1.5 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                          <button
                            onClick={() => setOpenId(null)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-mute px-3 py-1.5 rounded-lg hover:bg-brand-line/40"
                          >
                            <X className="w-3.5 h-3.5" /> Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

function StatTile({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className={cn("rounded-2xl p-4 text-white bg-gradient-to-br shadow-md", color)}>
      <p className="text-xs uppercase font-semibold opacity-90">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
