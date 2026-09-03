import CROPS from "@/data/crops.json";

type Crop = (typeof CROPS)[number];

export type YieldInput = {
  cropName: string;
  n: number;
  p: number;
  k: number;
  temperatureC: number;
  humidityPct: number;
  ph: number;
  rainfallMm: number;
  irrigation?:
    | "borewell"
    | "canal"
    | "rainfed"
    | "drip"
    | "sprinkler"
    | "unknown";
};

export type YieldEstimate = {
  crop: string;
  baselineQtlPerAcre: number;
  predictedQtlPerAcre: number;
  lowQtlPerAcre: number;
  highQtlPerAcre: number;
  factors: { label: string; deltaPct: number }[];
};

function midpoint(r: [number, number]) {
  return (r[0] + r[1]) / 2;
}

/**
 * Heuristic yield model: start from crop's average yield, apply multiplicative
 * factors for each condition (N, P, K, temperature, humidity, pH, rainfall,
 * irrigation), then produce a low-high range as ±15 % of the point estimate.
 *
 * Each factor caps at ±25 % contribution so no single input dominates.
 */
export function estimateYield(input: YieldInput): YieldEstimate | null {
  const crop = (CROPS as Crop[]).find(
    (c) => c.name.toLowerCase() === input.cropName.toLowerCase()
  );
  if (!crop) return null;

  const base = crop.avgYieldQtlPerAcre;
  const factors: { label: string; deltaPct: number }[] = [];

  function apply(label: string, cur: number, range: [number, number]) {
    const target = midpoint(range as [number, number]);
    const span = range[1] - range[0] || 1;
    // 0 when at midpoint, ±1 when at edge, ±2 when double the edge distance
    const dev = (cur - target) / span;
    // Bell-shaped penalty: within range = ~no penalty, outside range = quadratic drop
    let delta: number;
    if (cur >= range[0] && cur <= range[1]) {
      delta = -Math.pow(dev * 2, 2) * 0.05; // ≤ 5 % penalty inside range
    } else {
      const outside = cur < range[0] ? range[0] - cur : cur - range[1];
      const outsideFrac = outside / span;
      delta = -Math.min(0.25, 0.1 + outsideFrac * 0.3);
    }
    factors.push({ label, deltaPct: Math.round(delta * 100) });
  }

  apply("Nitrogen (N)", input.n, crop.nRange as [number, number]);
  apply("Phosphorus (P)", input.p, crop.pRange as [number, number]);
  apply("Potassium (K)", input.k, crop.kRange as [number, number]);
  apply("Temperature", input.temperatureC, crop.tempRange as [number, number]);
  apply("Humidity", input.humidityPct, crop.humidityRange as [number, number]);
  apply("Soil pH", input.ph, crop.phRange as [number, number]);
  apply("Rainfall / water", input.rainfallMm, crop.rainfallRange as [number, number]);

  // Irrigation bonus/penalty
  const water = crop.waterNeed;
  if (input.irrigation === "drip" || input.irrigation === "sprinkler") {
    factors.push({ label: "Micro-irrigation bonus", deltaPct: 8 });
  } else if (input.irrigation === "rainfed" && water === "high") {
    factors.push({ label: "Rainfed but crop needs high water", deltaPct: -15 });
  }

  const multiplier = factors.reduce(
    (acc, f) => acc * (1 + f.deltaPct / 100),
    1
  );
  const predicted = Math.max(0.5, base * multiplier);
  return {
    crop: crop.name,
    baselineQtlPerAcre: base,
    predictedQtlPerAcre: Math.round(predicted * 10) / 10,
    lowQtlPerAcre: Math.round(predicted * 0.85 * 10) / 10,
    highQtlPerAcre: Math.round(predicted * 1.15 * 10) / 10,
    factors,
  };
}
