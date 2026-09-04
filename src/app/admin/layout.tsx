"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, LogOut, MessageSquare, Users, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin", label: "Feedback", icon: MessageSquare, exact: true },
  { href: "/admin/users", label: "Users", icon: Users, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const isLogin = pathname?.startsWith("/admin/login");

  useEffect(() => {
    if (isLogin) {
      setChecking(false);
      return;
    }
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d?.admin) {
          router.replace("/admin/login");
        } else {
          setEmail(d.admin.email);
          setChecking(false);
        }
      })
      .catch(() => router.replace("/admin/login"));
  }, [pathname, router, isLogin]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (isLogin) return <>{children}</>;
  if (checking) {
    return <div className="min-h-screen grid place-items-center text-brand-mute">Loading admin…</div>;
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="sticky top-0 z-30 bg-white border-b border-brand-line shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="inline-flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center shadow shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-brand-ink leading-none">Admin Portal</p>
              <p className="text-[11px] text-brand-mute mt-0.5 truncate">{email}</p>
            </div>
          </Link>
          <nav className="ml-4 hidden sm:flex items-center gap-1">
            {TABS.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "text-sm font-semibold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition",
                    active
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-brand-mute hover:bg-brand-line/40 hover:text-brand-ink"
                  )}
                >
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={() => window.location.reload()}
            className="ml-auto p-2 rounded-lg hover:bg-brand-line/40"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={logout}
            className="text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-line/60 hover:bg-brand-line font-semibold"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
        {/* Mobile tabs */}
        <div className="sm:hidden border-t border-brand-line flex">
          {TABS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 text-center text-xs font-semibold py-2.5 inline-flex items-center justify-center gap-1",
                  active ? "text-brand-primary border-b-2 border-brand-primary" : "text-brand-mute"
                )}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </Link>
            );
          })}
        </div>
      </header>
      {children}
    </div>
  );
}
