"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldOff,
  ShieldCheck,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Sprout,
  Ruler,
  Droplets,
  Clock,
  MessageSquare,
  Sparkles,
  FlaskConical,
  ScanLine,
  LogIn,
  LogOut,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Detail = {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    emailVerified: boolean;
    disabled: boolean;
    preferredLanguage: string;
    onboardingCompleted: boolean;
    location: { state?: string; district?: string; lat?: number; lon?: number } | null;
    farm: {
      landSizeAcres?: number;
      soilType?: string;
      irrigation?: string;
      primaryCrops?: string[];
      sowingDates?: Record<string, string>;
    } | null;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    activityCount: number;
    chatMsgCount: number;
    chatSessionCount: number;
    postCount: number;
    feedbackCount: number;
  };
  byAction: { action: string; count: number; lastAt: string }[];
};

type Activity = {
  id: string;
  action: string;
  meta: Record<string, unknown>;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
};

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  "auth.signup_verified": { label: "Signed up", icon: <UserPlus className="w-4 h-4" />, color: "emerald" },
  "auth.login_success": { label: "Logged in", icon: <LogIn className="w-4 h-4" />, color: "sky" },
  "auth.login_failed": { label: "Failed login", icon: <ShieldOff className="w-4 h-4" />, color: "rose" },
  "auth.logout": { label: "Logged out", icon: <LogOut className="w-4 h-4" />, color: "slate" },
  "chat.message": { label: "Chat message", icon: <MessageSquare className="w-4 h-4" />, color: "violet" },
  "scan.disease": { label: "Scanned leaf", icon: <ScanLine className="w-4 h-4" />, color: "teal" },
  "ml.crop_recommend": { label: "Crop recommendation", icon: <Sprout className="w-4 h-4" />, color: "emerald" },
  "ml.fertilizer_advise": { label: "Fertilizer advice", icon: <FlaskConical className="w-4 h-4" />, color: "amber" },
  "feedback.submitted": { label: "Feedback sent", icon: <Sparkles className="w-4 h-4" />, color: "pink" },
  "community.post_created": { label: "Community post", icon: <Users className="w-4 h-4" />, color: "orange" },
  "onboarding.completed": { label: "Completed onboarding", icon: <ShieldCheck className="w-4 h-4" />, color: "emerald" },
  "profile.updated": { label: "Updated profile", icon: <ShieldCheck className="w-4 h-4" />, color: "slate" },
};

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-100 text-emerald-700",
  sky: "bg-sky-100 text-sky-700",
  rose: "bg-rose-100 text-rose-700",
  slate: "bg-slate-100 text-slate-700",
  violet: "bg-violet-100 text-violet-700",
  teal: "bg-teal-100 text-teal-700",
  amber: "bg-amber-100 text-amber-700",
  pink: "bg-pink-100 text-pink-700",
  orange: "bg-orange-100 text-orange-700",
};

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [detail, setDetail] = useState<Detail | null>(null);
  const [activity, setActivity] = useState<Activity[] | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [d, a] = await Promise.all([
      fetch(`/api/admin/users/${id}`).then((r) => r.json()),
      fetch(`/api/admin/users/${id}/activity?limit=200`).then((r) => r.json()),
    ]);
    setDetail(d);
    setActivity(a.items ?? []);
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleDisabled() {
    if (!detail) return;
    setSaving(true);
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: !detail.user.disabled }),
    });
    await load();
    setSaving(false);
  }

  async function del() {
    if (!detail) return;
    if (
      !confirm(
        `Delete ${detail.user.name} permanently? This wipes their chat, posts, feedback, and activity too.`
      )
    )
      return;
    setSaving(true);
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    router.replace("/admin/users");
  }

  if (!detail) {
    return (
      <main className="max-w-4xl mx-auto p-4">
        <div className="h-40 rounded-2xl bg-brand-line/40 animate-pulse" />
      </main>
    );
  }

  const u = detail.user;
  const filteredActivity = activity?.filter((a) => actionFilter === "all" || a.action === actionFilter) ?? [];

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-4">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1 text-sm text-brand-mute hover:text-brand-ink"
      >
        <ArrowLeft className="w-4 h-4" /> Back to users
      </Link>

      {/* Profile header */}
      <Card className="relative overflow-hidden">
        <div className="flex items-start gap-4 flex-wrap">
          <div
            className={cn(
              "w-16 h-16 rounded-2xl grid place-items-center font-bold text-2xl shrink-0 text-white shadow-md",
              u.disabled
                ? "bg-gradient-to-br from-slate-400 to-slate-600"
                : "bg-gradient-to-br from-emerald-500 to-teal-600"
            )}
          >
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{u.name}</h1>
              {u.disabled ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 inline-flex items-center gap-1">
                  <ShieldOff className="w-3 h-3" /> Disabled
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Active
                </span>
              )}
              {u.emailVerified && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                  Email verified
                </span>
              )}
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-brand-line text-brand-mute">
                {u.preferredLanguage.toUpperCase()}
              </span>
            </div>
            <div className="mt-2 grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5 text-brand-mute">
                <Mail className="w-3.5 h-3.5" /> {u.email}
              </span>
              {u.phone && (
                <span className="inline-flex items-center gap-1.5 text-brand-mute">
                  <Phone className="w-3.5 h-3.5" /> {u.phone}
                </span>
              )}
              {u.location?.district && (
                <span className="inline-flex items-center gap-1.5 text-brand-mute">
                  <MapPin className="w-3.5 h-3.5" /> {u.location.district}
                  {u.location.state && `, ${u.location.state}`}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-brand-mute">
                <Clock className="w-3.5 h-3.5" /> Joined {new Date(u.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant={u.disabled ? "primary" : "secondary"}
              onClick={toggleDisabled}
              disabled={saving}
            >
              <span className="inline-flex items-center gap-1">
                {u.disabled ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                {u.disabled ? "Enable" : "Disable"}
              </span>
            </Button>
            <button
              onClick={del}
              disabled={saving}
              className="text-xs inline-flex items-center gap-1 font-semibold text-brand-danger bg-brand-danger/10 hover:bg-brand-danger/20 px-3 py-1.5 rounded-lg"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </Card>

      {/* Stats + farm */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardTitle className="mb-3">Farm profile</CardTitle>
          {u.farm && (u.farm.primaryCrops?.length || u.farm.landSizeAcres) ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {u.farm.landSizeAcres != null && (
                <StatCell icon={<Ruler className="w-4 h-4" />} label="Land" value={`${u.farm.landSizeAcres} acres`} />
              )}
              {u.farm.soilType && (
                <StatCell icon={<Sprout className="w-4 h-4" />} label="Soil" value={u.farm.soilType} />
              )}
              {u.farm.irrigation && (
                <StatCell icon={<Droplets className="w-4 h-4" />} label="Water" value={u.farm.irrigation} />
              )}
              {u.farm.primaryCrops && u.farm.primaryCrops.length > 0 && (
                <StatCell
                  icon={<Sprout className="w-4 h-4" />}
                  label="Crops"
                  value={u.farm.primaryCrops.join(", ")}
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-brand-mute">Onboarding incomplete or no farm data.</p>
          )}
        </Card>

        <Card>
          <CardTitle className="mb-3">Usage stats</CardTitle>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <StatCell icon={<Clock className="w-4 h-4" />} label="Total events" value={detail.stats.activityCount} />
            <StatCell icon={<MessageSquare className="w-4 h-4" />} label="Chat msgs" value={detail.stats.chatMsgCount} />
            <StatCell icon={<Users className="w-4 h-4" />} label="Community posts" value={detail.stats.postCount} />
            <StatCell icon={<Sparkles className="w-4 h-4" />} label="Feedback" value={detail.stats.feedbackCount} />
          </div>
        </Card>
      </div>

      {/* Activity timeline */}
      <Card>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <CardTitle>Activity timeline</CardTitle>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="ml-auto px-3 py-1.5 rounded-lg border border-brand-line bg-white text-xs"
          >
            <option value="all">All actions ({activity?.length ?? 0})</option>
            {detail.byAction.map((a) => (
              <option key={a.action} value={a.action}>
                {(ACTION_META[a.action]?.label ?? a.action) + ` (${a.count})`}
              </option>
            ))}
          </select>
        </div>

        {filteredActivity.length === 0 ? (
          <p className="text-sm text-brand-mute py-6 text-center">No activity yet.</p>
        ) : (
          <ol className="relative border-l-2 border-brand-line/60 ml-3 space-y-3">
            {filteredActivity.map((ev) => {
              const meta = ACTION_META[ev.action] ?? {
                label: ev.action,
                icon: <Clock className="w-4 h-4" />,
                color: "slate",
              };
              return (
                <li key={ev.id} className="pl-4 relative">
                  <span
                    className={cn(
                      "absolute -left-[13px] top-1 w-6 h-6 rounded-full grid place-items-center ring-2 ring-white",
                      COLOR_MAP[meta.color]
                    )}
                  >
                    {meta.icon}
                  </span>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-brand-ink">{meta.label}</p>
                    <span className="text-[11px] text-brand-mute">
                      {new Date(ev.createdAt).toLocaleString()}
                    </span>
                    {ev.ip && <span className="text-[10px] text-brand-mute font-mono">{ev.ip}</span>}
                  </div>
                  {Object.keys(ev.meta).length > 0 && (
                    <p className="text-xs text-brand-mute mt-0.5 font-mono truncate">
                      {formatMeta(ev.meta)}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </Card>
    </main>
  );
}

function StatCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-brand-bg border border-brand-line px-3 py-2">
      <p className="text-[10px] uppercase text-brand-mute font-semibold inline-flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="font-bold text-brand-ink mt-0.5 truncate">{value}</p>
    </div>
  );
}

function formatMeta(m: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(m)) {
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    parts.push(`${k}: ${s.slice(0, 60)}`);
  }
  return parts.slice(0, 4).join(" · ");
}
