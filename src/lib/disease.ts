import DISEASES from "@/data/diseases.json";

export type DiseaseInfo = {
  displayName: string;
  hi: string;
  pa: string;
  severity: string;
  treatment: string[];
  hiTreatment: string[];
};

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
};

const MAP = DISEASES as Record<string, DiseaseInfo>;

export function lookupDisease(rawLabel: string, confidence: number, source: DiseasePrediction["source"]): DiseasePrediction {
  const normalized = rawLabel.replace(/\s+/g, "_");
  const info = MAP[normalized] ?? MAP["unknown"];
  return {
    key: normalized,
    displayName: info.displayName,
    hi: info.hi,
    pa: info.pa,
    confidence,
    severity: info.severity,
    treatment: info.treatment,
    hiTreatment: info.hiTreatment,
    source,
  };
}

const HF_INFERENCE_URL =
  "https://api-inference.huggingface.co/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification";

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

  // Route 2: HF Inference API
  const hfToken = process.env.HUGGINGFACE_API_TOKEN;
  if (hfToken) {
    try {
      const res = await fetch(HF_INFERENCE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/octet-stream",
        },
        body: imageBuffer,
      });
      if (res.ok) {
        const data = (await res.json()) as { label: string; score: number }[];
        if (Array.isArray(data) && data.length > 0) {
          return lookupDisease(data[0].label, data[0].score, "hf-inference");
        }
      }
    } catch (e) {
      console.warn("[disease] HF Inference call failed, falling back", e);
    }
  }

  // Route 3: demo fallback so the UI still works before deployment
  const keys = Object.keys(MAP).filter((k) => k !== "unknown");
  const demoKey = keys[Math.floor(Math.random() * keys.length)];
  return lookupDisease(demoKey, 0.72, "demo");
}
