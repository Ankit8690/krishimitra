"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Sprout, ShieldOff, CheckCircle2, ChevronRight, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  preferredLanguage: string;
  disabled: boolean;
  onboardingCompleted: boolean;
  state: string | null;
  district: string | null;
  primaryCrops: string[];
  createdAt: string;
  activityCount: number;
  lastActivityAt: string | null;
};

type Stats = { total: number; active: number; disabled: number };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "disabled">("all");
  const [loading, setLoading] = useState(true);

  async function load() {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status !== "all") params.set("status", status);
    const r = await fetch(`/api/admin/users?${params}`);
    const d = await r.json();
    setUsers(d.users ?? []);
    setStats(d.stats ?? null);
  }

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const rows = useMemo(() => users, [users]);

  return (
    <main className="max-w-6xl mx-auto p-4 space-y-4">
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Total users" value={stats.total} color="from-slate-500 to-slate-600" />
          <StatTile label="Active" value={stats.active} color="from-emerald-500 to-teal-600" />
          <StatTile label="Disabled" value={stats.disabled} color="from-rose-500 to-red-600" />
        </div>
      )}

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-brand-mute" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, or phone…"
              className="pl-9"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="px-3 py-2 rounded-xl border border-brand-line bg-white text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active only</option>
            <option value="disabled">Disabled only</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-brand-line/40 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Card className="text-center py-10 text-brand-mute">
          <Users className="w-8 h-8 mx-auto opacity-40" />
          <p className="mt-2 text-sm">No users match.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((u) => (
            <Link key={u.id} href={`/admin/users/${u.id}`} className="block group">
              <Card className="p-4 hover:shadow-lg transition group-active:scale-[0.995]">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-full grid place-items-center font-bold shrink-0 text-white",
                      u.disabled
                        ? "bg-gradient-to-br from-slate-400 to-slate-600"
                        : "bg-gradient-to-br from-emerald-500 to-teal-600"
                    )}
                  >
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-brand-ink truncate">{u.name}</p>
                      {u.disabled && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 inline-flex items-center gap-0.5">
                          <ShieldOff className="w-3 h-3" /> Disabled
                        </span>
                      )}
                      {u.emailVerified && !u.disabled && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 inline-flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded-full bg-brand-line text-brand-mute">
                        {u.preferredLanguage.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-brand-mute">
                      <span className="truncate">{u.email}</span>
                      {u.phone && <span>· {u.phone}</span>}
                      {u.district && (
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {u.district}
                          {u.state && `, ${u.state}`}
                        </span>
                      )}
                      {u.primaryCrops.length > 0 && (
                        <span className="inline-flex items-center gap-0.5">
                          <Sprout className="w-3 h-3" /> {u.primaryCrops.slice(0, 3).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] uppercase text-brand-mute font-semibold">Activity</p>
                    <p className="text-lg font-bold text-brand-ink leading-none">{u.activityCount}</p>
                    <p className="text-[10px] text-brand-mute mt-0.5">
                      {u.lastActivityAt
                        ? new Date(u.lastActivityAt).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-brand-mute shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn("rounded-2xl p-4 text-white bg-gradient-to-br shadow-md", color)}>
      <p className="text-xs uppercase font-semibold opacity-90">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
