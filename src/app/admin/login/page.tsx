"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, LogIn } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Login failed");
      } else {
        router.replace("/admin");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center shadow-xl ring-4 ring-white/10">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mt-4">KrishiMitra Admin</h1>
          <p className="text-sm text-white/70 mt-1">Restricted area — authorized personnel only</p>
        </div>
        <Card>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Admin email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p className="text-sm text-brand-danger bg-brand-danger/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <Button size="lg" className="w-full" disabled={loading}>
              <span className="inline-flex items-center gap-2">
                <LogIn className="w-4 h-4" /> {loading ? "Signing in…" : "Sign in"}
              </span>
            </Button>
          </form>
        </Card>
        <p className="text-center text-xs text-white/50 mt-4">
          Credentials are set via <code className="bg-white/10 px-1 rounded">ADMIN_EMAIL</code> and{" "}
          <code className="bg-white/10 px-1 rounded">ADMIN_PASSWORD</code> environment variables.
        </p>
      </div>
    </div>
  );
}
