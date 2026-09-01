"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Camera,
  Upload,
  RefreshCw,
  ScanLine,
  Volume2,
  Info,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/I18nProvider";

type Alt = { label: string; displayName: string; confidence: number };
type Prediction = {
  key: string;
  displayName: string;
  hi: string;
  pa: string;
  confidence: number;
  severity: string;
  treatment: string[];
  hiTreatment: string[];
  source: "self-hosted" | "hf-inference" | "demo";
  uncertain: boolean;
  alternatives: Alt[];
};

const SUPPORTED_CROPS = [
  "Apple", "Blueberry", "Cherry", "Maize", "Grape", "Orange",
  "Peach", "Bell Pepper", "Potato", "Raspberry", "Soybean",
  "Squash", "Strawberry", "Tomato",
];

export default function ScanPage() {
  const { locale } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPreview(null);
    setPrediction(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onFile(file: File) {
    setError(null);
    setPrediction(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo is too large — max 5 MB");
      return;
    }
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ml/disease", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Detection failed");
      else setPrediction(data.prediction);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = locale === "hi" ? "hi-IN" : locale === "pa" ? "pa-IN" : "en-IN";
    utter.rate = 0.95;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  const localizedName =
    locale === "hi"
      ? prediction?.hi
      : locale === "pa"
        ? prediction?.pa
        : prediction?.displayName;

  const localizedTreatment =
    locale === "hi" ? prediction?.hiTreatment : prediction?.treatment;

  return (
    <div className="max-w-md mx-auto px-5 pt-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <ScanLine className="w-5 h-5 text-brand-primary" />
        <h1 className="text-xl font-bold">Disease scan</h1>
      </div>

      {!preview && (
        <>
          <Card className="text-center py-10">
            <ScanLine className="w-16 h-16 mx-auto text-brand-primary/60" />
            <p className="mt-3 text-brand-mute px-4 text-sm">
              Take a close-up of the affected leaf in daylight. AI will identify
              the disease and suggest treatment in your language.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 px-4">
              <Button size="lg" onClick={() => inputRef.current?.click()}>
                <Camera className="w-5 h-5" /> Camera
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  if (inputRef.current) {
                    inputRef.current.removeAttribute("capture");
                    inputRef.current.click();
                  }
                }}
              >
                <Upload className="w-5 h-5" /> Upload
              </Button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
          </Card>
          <SupportedCropsNote />
        </>
      )}

      {preview && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-brand-line aspect-[4/3] bg-black">
            <Image
              src={preview}
              alt="leaf preview"
              fill
              sizes="(max-width: 480px) 100vw, 480px"
              className="object-contain"
              unoptimized
            />
          </div>

          {loading && (
            <Card className="text-center py-6 text-brand-mute">
              <RefreshCw className="w-5 h-5 mx-auto animate-spin" />
              <p className="mt-2 text-sm">Analyzing leaf…</p>
            </Card>
          )}

          {error && <Card className="text-brand-danger">{error}</Card>}

          {prediction && (
            <>
              {prediction.uncertain ? (
                <Card className="p-0 overflow-hidden">
                  <div className="p-4">
                    <p className="text-xs text-brand-mute uppercase tracking-wide">
                      Result
                    </p>
                    <h2 className="text-lg font-bold mt-0.5 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-primary" />
                      Analyzing this crop
                    </h2>
                    <p className="text-sm text-brand-mute mt-2 leading-relaxed">
                      The AI isn&apos;t sure enough to name a specific disease.
                      This often happens with crops it hasn&apos;t seen yet.
                    </p>
                  </div>
                  {prediction.alternatives.length > 0 && (
                    <div className="border-t border-brand-line px-4 py-3 bg-brand-bg/60">
                      <p className="text-xs uppercase tracking-wide text-brand-mute mb-2">
                        Closest matches
                      </p>
                      <ul className="space-y-1.5">
                        {prediction.alternatives.map((a, i) => (
                          <li
                            key={a.label + i}
                            className="flex justify-between items-center text-sm"
                          >
                            <span>{a.displayName}</span>
                            <span className="text-brand-mute font-mono text-xs">
                              {Math.round(a.confidence * 100)}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ) : (
                <Card className="p-0 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-brand-mute uppercase tracking-wide">
                          Result
                        </p>
                        <h2 className="text-lg font-bold mt-0.5">
                          {localizedName}
                        </h2>
                        <p className="text-xs text-brand-mute mt-1">
                          Confidence: {Math.round(prediction.confidence * 100)}%
                          {prediction.source === "demo" && " · demo model"}
                        </p>
                      </div>
                      <SeverityBadge severity={prediction.severity} />
                    </div>
                    <button
                      onClick={() =>
                        speak(
                          `${localizedName}. ${(localizedTreatment || []).join(". ")}`
                        )
                      }
                      className="mt-3 inline-flex items-center gap-1 text-xs text-brand-primary font-semibold"
                    >
                      <Volume2 className="w-4 h-4" /> Speak treatment
                    </button>
                  </div>
                  <div className="border-t border-brand-line px-4 py-3 bg-brand-bg/60">
                    <CardTitle className="mb-2">Treatment</CardTitle>
                    <ol className="space-y-1.5 text-sm list-decimal pl-5">
                      {(localizedTreatment || []).map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>
                  {prediction.alternatives.length > 1 && (
                    <div className="border-t border-brand-line px-4 py-2 text-xs text-brand-mute">
                      Also considered: {prediction.alternatives
                        .slice(1, 3)
                        .map(
                          (a) =>
                            `${a.displayName} (${Math.round(a.confidence * 100)}%)`
                        )
                        .join(" · ")}
                    </div>
                  )}
                </Card>
              )}
            </>
          )}

          <Button variant="secondary" className="w-full" onClick={reset}>
            <RefreshCw className="w-4 h-4" /> Scan another leaf
          </Button>

          {prediction?.source === "demo" && (
            <p className="text-center text-xs text-brand-mute">
              Add <code>HUGGINGFACE_API_TOKEN</code> to <code>.env.local</code>{" "}
              for real detection.
            </p>
          )}

          {prediction?.uncertain && <SupportedCropsNote />}
        </div>
      )}
    </div>
  );
}

function SupportedCropsNote() {
  return (
    <Card className="mt-4 bg-brand-primary/5">
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">Supported crops right now</p>
          <p className="text-xs text-brand-mute mt-1">
            The AI is trained on these {SUPPORTED_CROPS.length} crops. Others
            (okra, wheat, rice, cotton, mustard, etc.) will be added as we grow
            the training data.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUPPORTED_CROPS.map((c) => (
              <span
                key={c}
                className="text-xs px-2 py-0.5 rounded-full bg-white border border-brand-line"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; className: string }> = {
    none: { label: "Healthy", className: "bg-brand-primary/15 text-brand-primary" },
    moderate: {
      label: "Moderate",
      className: "bg-brand-accent/15 text-brand-accent",
    },
    high: { label: "Severe", className: "bg-brand-danger/15 text-brand-danger" },
    unknown: { label: "Unknown", className: "bg-brand-line text-brand-mute" },
  };
  const s = map[severity] ?? map.unknown;
  return (
    <span
      className={cn(
        "text-xs font-semibold px-2.5 py-1 rounded-full shrink-0",
        s.className
      )}
    >
      {s.label}
    </span>
  );
}
