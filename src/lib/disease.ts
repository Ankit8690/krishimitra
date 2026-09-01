import DISEASES from "@/data/diseases.json";

export type DiseaseInfo = {
  displayName: string;
  hi: string;
  pa: string;
  severity: string;
  treatment: string[];
  hiTreatment: string[];
};

export type Alternative = { label: string; displayName: string; confidence: number };

export type DiseasePrediction = {
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
  alternatives: Alternative[];
};

const CONFIDENCE_THRESHOLD = 0.6;

export const SUPPORTED_CROPS = [
  "Apple", "Blueberry", "Cherry", "Maize/Corn", "Grape", "Orange",
  "Peach", "Bell Pepper", "Potato", "Raspberry", "Soybean",
  "Squash", "Strawberry", "Tomato",
];

const MAP = DISEASES as Record<string, DiseaseInfo>;

function infoFor(rawLabel: string): DiseaseInfo {
  let info = MAP[rawLabel];
  if (!info) {
    const key = Object.keys(MAP).find(
      (k) => k.toLowerCase() === rawLabel.toLowerCase()
    );
    if (key) info = MAP[key];
  }
  return info ?? MAP["unknown"];
}

export function buildPrediction(
  candidates: { label: string; score: number }[],
  source: DiseasePrediction["source"]
): DiseasePrediction {
  const top = candidates[0] ?? { label: "unknown", score: 0 };
  const uncertain = top.score < CONFIDENCE_THRESHOLD;
  const chosenInfo = uncertain ? MAP["unknown"] : infoFor(top.label);
  const chosenLabel = uncertain ? "unknown" : top.label;
  return {
    key: chosenLabel,
    displayName: chosenInfo.displayName,
    hi: chosenInfo.hi,
    pa: chosenInfo.pa,
    confidence: top.score,
    severity: chosenInfo.severity,
    treatment: chosenInfo.treatment,
    hiTreatment: chosenInfo.hiTreatment,
    source,
    uncertain,
    alternatives: candidates.slice(0, 3).map((c) => ({
      label: c.label,
      displayName: infoFor(c.label).displayName,
      confidence: c.score,
    })),
  };
}

// Back-compat single-label helper (used by demo fallback).
export function lookupDisease(rawLabel: string, confidence: number, source: DiseasePrediction["source"]): DiseasePrediction {
  return buildPrediction([{ label: rawLabel, score: confidence }], source);
}

// Post-2025 HuggingFace Inference Providers router.
// The old api-inference.huggingface.co host was retired.
const HF_INFERENCE_URL =
  "https://router.huggingface.co/hf-inference/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification";

export async function detectDisease(imageBuffer: ArrayBuffer): Promise<DiseasePrediction> {
  // Route 1: self-hosted FastAPI on user's own HF Space
  const base = process.env.ML_API_BASE;
  if (base) {
    try {
      const fd = new FormData();
      fd.append("file", new Blob([imageBuffer]), "leaf.jpg");
      const res = await fetch(`${base.replace(/\/$/, "")}/disease`, {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        const data = (await res.json()) as { label: string; confidence: number };
        return lookupDisease(data.label, data.confidence, "self-hosted");
      }
    } catch (e) {
      console.warn("[disease] self-hosted call failed, falling back", e);
    }
  }

  // Route 2: HF Inference API (with one retry on model-cold-start 503)
  const hfToken = process.env.HUGGINGFACE_API_TOKEN;
  if (hfToken) {
    console.log("[disease] using HF Inference API");
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await fetch(HF_INFERENCE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${hfToken}`,
            "Content-Type": "application/octet-stream",
            "x-wait-for-model": "true",
          },
          body: imageBuffer,
        });
        if (res.ok) {
          const data = (await res.json()) as { label: string; score: number }[];
          if (Array.isArray(data) && data.length > 0) {
            const sorted = [...data].sort((a, b) => b.score - a.score);
            console.log(
              `[disease] HF top: ${sorted[0].label} (${sorted[0].score.toFixed(2)})`
            );
            return buildPrediction(sorted, "hf-inference");
          }
          console.warn("[disease] HF returned empty array");
          break;
        }
        const bodyText = await res.text();
        console.warn(
          `[disease] HF status ${res.status} attempt ${attempt}: ${bodyText.slice(0, 200)}`
        );
        if (res.status === 503 && attempt === 1) {
          // Model is loading — wait a bit then retry
          await new Promise((r) => setTimeout(r, 6000));
          continue;
        }
        break;
      } catch (e) {
        console.warn(`[disease] HF Inference threw (attempt ${attempt})`, e);
      }
    }
  } else {
    console.log("[disease] no HUGGINGFACE_API_TOKEN — using demo fallback");
  }

  // Route 3: demo fallback so the UI still works before deployment
  const keys = Object.keys(MAP).filter((k) => k !== "unknown");
  const demoKey = keys[Math.floor(Math.random() * keys.length)];
  return lookupDisease(demoKey, 0.72, "demo");
}
