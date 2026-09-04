// Pre-wired swap point for a future crop-recommendation ML model.
//
// TWO independent hooks — you can enable either or both:
//
//   1. CROP_ML_SCORE_URL — a classifier that takes farmer inputs and returns
//      a `matchScore` per crop (0..1). Overrides the rule-based scorer.
//      Expected response:
//        { "scores": { "Wheat": 0.87, "Rice": 0.42, ... } }
//
//   2. CROP_ML_YIELD_URL — a regressor that predicts yield (qtl/acre) per
//      crop for this farmer's conditions. Overrides the static
//      avgYieldQtlPerAcre from crops.json.
//      Expected response:
//        { "yields": { "Wheat": 22.5, "Rice": 30.1, ... } }
//
// Both endpoints receive the same POST body:
//   { input: SoilInput, crops: string[], district?: string, state?: string }
//
// Failure modes never break the app — any error/timeout returns null and the
// caller silently falls back to the rule engine + static yields. Log lines
// tagged [cropML] make it obvious in the server console which engine served
// the request.

import type { SoilInput, CropScore } from "./cropRec";
import CROPS from "@/data/crops.json";

const FETCH_TIMEOUT_MS = 4000;

type ScoreResponse = { scores: Record<string, number> };
type YieldResponse = { yields: Record<string, number> };

async function postJson<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CROP_ML_TOKEN
          ? { Authorization: `Bearer ${process.env.CROP_ML_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn(`[cropML] ${url} → ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[cropML] request failed: ${msg}`);
    return null;
  }
}

/**
 * Ask the ML scorer for per-crop match scores. Returns null when no scorer
 * is configured OR the call fails — caller must fall back to `scoreCrops`.
 * When the scorer succeeds, it merges its scores into the passed rule-based
 * `baseScores` (keeping fit/misfit reasons from rules for explainability).
 */
export async function mlEnrichScores(
  input: SoilInput,
  district: string | undefined,
  state: string | undefined,
  baseScores: CropScore[]
): Promise<CropScore[] | null> {
  const url = process.env.CROP_ML_SCORE_URL;
  if (!url) return null;

  const cropNames = baseScores.map((s) => s.crop.name);
  const resp = await postJson<ScoreResponse>(url, {
    input,
    crops: cropNames,
    district,
    state,
  });
  if (!resp?.scores) return null;

  // Hybrid: use ML score for ranking, keep rule reasons for the UI. If the ML
  // model doesn't return a crop, keep the rule score for that crop.
  const merged = baseScores.map((s) => ({
    ...s,
    matchScore: resp.scores[s.crop.name] ?? s.matchScore,
  }));
  merged.sort((a, b) => b.matchScore - a.matchScore);
  console.log(`[cropML] score engine: ml (${Object.keys(resp.scores).length}/${cropNames.length} crops covered)`);
  return merged;
}

/**
 * Ask the ML regressor for personalised yields per crop. Returns a map keyed
 * by crop name (matching crops.json `name`), or null if not configured / it
 * errors. Callers use these overrides in place of `avgYieldQtlPerAcre`.
 */
export async function mlPredictYields(
  input: SoilInput,
  district: string | undefined,
  state: string | undefined,
  crops: string[]
): Promise<Map<string, number> | null> {
  const url = process.env.CROP_ML_YIELD_URL;
  if (!url) return null;

  const resp = await postJson<YieldResponse>(url, {
    input,
    crops,
    district,
    state,
  });
  if (!resp?.yields) return null;

  const map = new Map<string, number>();
  for (const [name, y] of Object.entries(resp.yields)) {
    if (typeof y === "number" && Number.isFinite(y) && y > 0) map.set(name, y);
  }
  console.log(`[cropML] yield engine: ml (${map.size} crops covered)`);
  return map.size > 0 ? map : null;
}

// Which engines are currently wired — useful for admin health chip + interview
// screenshots ("we support ML swap-in — currently using rules").
export function cropMLStatus(): {
  scoreEngine: "ml" | "rules";
  yieldEngine: "ml" | "static";
} {
  return {
    scoreEngine: process.env.CROP_ML_SCORE_URL ? "ml" : "rules",
    yieldEngine: process.env.CROP_ML_YIELD_URL ? "ml" : "static",
  };
}

// Named export of the crop catalogue so admin / debug tools can list what
// the ML endpoint should support without re-reading the JSON.
export const CROP_CATALOG: string[] = (CROPS as { name: string }[]).map((c) => c.name);
