"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";
import { ArrowLeft, ExternalLink, Check, X, Landmark } from "lucide-react";

type Scheme = {
  id: string;
  name: string;
  shortName: string;
  benefit: string;
  summary: string;
  howToApply: string[];
  url: string;
  ministry: string;
  eligible: boolean;
};

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/schemes")
      .then((r) => r.json())
      .then((d) => (d.schemes ? setSchemes(d.schemes) : setError("Failed")))
      .catch(() => setError("Failed"));
  }, []);

  return (
    <div className="max-w-md mx-auto px-5 pt-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-brand-line/40">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Landmark className="w-5 h-5 text-brand-primary" />
        <h1 className="text-xl font-bold">Govt schemes</h1>
      </div>

      {!schemes && !error && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-brand-line/40 animate-pulse" />
          ))}
        </div>
      )}
      {error && <Card className="text-brand-mute">{error}</Card>}

      {schemes && (
        <div className="space-y-3">
          {schemes.map((s) => {
            const open = expanded === s.id;
            return (
              <Card key={s.id} className="p-0 overflow-hidden">
                <button
                  onClick={() => setExpanded(open ? null : s.id)}
                  className="w-full text-left p-4 active:bg-brand-line/20"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 shrink-0 rounded-full grid place-items-center text-xs font-bold ${
                        s.eligible
                          ? "bg-brand-primary text-white"
                          : "bg-brand-line text-brand-mute"
                      }`}
                      aria-label={s.eligible ? "Eligible" : "Not eligible"}
                    >
                      {s.eligible ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-semibold truncate">{s.name}</p>
                        <span className="text-[10px] uppercase tracking-wide text-brand-mute shrink-0">
                          {s.shortName}
                        </span>
                      </div>
                      <p className="text-sm text-brand-primary font-semibold mt-0.5">
                        {s.benefit}
                      </p>
                      <p className="text-xs text-brand-mute mt-1 line-clamp-2">
                        {s.summary}
                      </p>
                    </div>
                  </div>
                </button>

                {open && (
                  <div className="border-t border-brand-line p-4 bg-brand-bg/60">
                    <CardTitle className="mb-2">How to apply</CardTitle>
                    <ol className="space-y-1.5 text-sm text-brand-ink list-decimal pl-5">
                      {s.howToApply.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                    <div className="mt-4 flex items-center justify-between text-xs text-brand-mute">
                      <span>{s.ministry}</span>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-primary font-semibold"
                      >
                        Official site <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
          <p className="text-center text-xs text-brand-mute pt-2">
            ✓ = you likely qualify based on your farm profile · always confirm on the official site
          </p>
        </div>
      )}
    </div>
  );
}
