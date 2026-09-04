import CROPS from "@/data/crops.json";

export type Crop = (typeof CROPS)[number];
export type SoilInput = {
  n: number;
  p: number;
  k: number;
  temperatureC: number;
  humidityPct: number;
  ph: number;
  rainfallMm: number;
};

export type CropScore = {
  crop: Crop;
  matchScore: number; // 0..1
  fitReasons: string[];
  misfitReasons: string[];
};

function inRange(v: number, r: [number, number]) {
  return v >= r[0] && v <= r[1];
}

function distanceScore(v: number, r: [number, number]): number {
  // 1 if inside; falls off linearly outside based on span
  if (inRange(v, r)) return 1;
  const span = r[1] - r[0];
  const d = v < r[0] ? r[0] - v : v - r[1];
  return Math.max(0, 1 - d / (span || 1));
}

const FEATURES: {
  key: keyof SoilInput;
  rangeKey: keyof Crop;
  weight: number;
  label: string;
  unit: string;
}[] = [
  { key: "temperatureC", rangeKey: "tempRange", weight: 1.2, label: "temperature", unit: "°C" },
  { key: "humidityPct", rangeKey: "humidityRange", weight: 1.0, label: "humidity", unit: "%" },
  { key: "ph", rangeKey: "phRange", weight: 1.2, label: "pH", unit: "" },
  { key: "rainfallMm", rangeKey: "rainfallRange", weight: 1.0, label: "rainfall", unit: "mm" },
  { key: "n", rangeKey: "nRange", weight: 0.9, label: "nitrogen (N)", unit: "kg/ha" },
  { key: "p", rangeKey: "pRange", weight: 0.9, label: "phosphorus (P)", unit: "kg/ha" },
  { key: "k", rangeKey: "kRange", weight: 0.9, label: "potassium (K)", unit: "kg/ha" },
];

export function scoreCrops(soil: SoilInput): CropScore[] {
  return (CROPS as Crop[])
    .map<CropScore>((crop) => {
      let total = 0;
      let maxTotal = 0;
      const fit: string[] = [];
      const misfit: string[] = [];
      for (const f of FEATURES) {
        const range = crop[f.rangeKey] as [number, number];
        const val = soil[f.key];
        const s = distanceScore(val, range);
        total += s * f.weight;
        maxTotal += f.weight;
        if (s === 1) {
          fit.push(`${f.label} ${val}${f.unit} fits`);
        } else if (s < 0.5) {
          misfit.push(
            `${f.label} ${val}${f.unit} outside ideal ${range[0]}–${range[1]}${f.unit}`
          );
        }
      }
      return {
        crop,
        matchScore: total / maxTotal,
        fitReasons: fit.slice(0, 3),
        misfitReasons: misfit.slice(0, 2),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

export type ProfitEstimate = {
  cropName: string;
  matchScore: number;
  fitReasons: string[];
  misfitReasons: string[];
  yieldQtlPerAcre: number;
  modalPricePerQtl: number | null;
  revenuePerAcre: number | null;
  costPerAcre: number;
  profitPerAcre: number | null;
  season: string;
  waterNeed: string;
  durationDays: number;
  hi: string;
  pa: string;
};

// Merge scores with live mandi prices to compute profit per acre. When a
// per-crop `yieldOverrides` map is supplied (from the ML yield regressor),
// those values replace the static `avgYieldQtlPerAcre` — the rest of the
// pipeline is identical, so profit + revenue automatically become
// personalised without any downstream code change.
export function withProfit(
  scores: CropScore[],
  priceByCommodity: Map<string, number>,
  yieldOverrides?: Map<string, number> | null
): ProfitEstimate[] {
  return scores.map((s) => {
    const modal =
      priceByCommodity.get(s.crop.name.toLowerCase()) ??
      priceByCommodity.get(s.crop.name.split(" ")[0].toLowerCase()) ??
      null;
    const yield_ = yieldOverrides?.get(s.crop.name) ?? s.crop.avgYieldQtlPerAcre;
    const revenue = modal != null ? Math.round(modal * yield_) : null;
    const profit = revenue != null ? revenue - s.crop.avgInputCostPerAcre : null;
    return {
      cropName: s.crop.name,
      hi: s.crop.hi,
      pa: s.crop.pa,
      matchScore: s.matchScore,
      fitReasons: s.fitReasons,
      misfitReasons: s.misfitReasons,
      yieldQtlPerAcre: Math.round(yield_ * 10) / 10,
      modalPricePerQtl: modal,
      revenuePerAcre: revenue,
      costPerAcre: s.crop.avgInputCostPerAcre,
      profitPerAcre: profit,
      season: s.crop.season,
      waterNeed: s.crop.waterNeed,
      durationDays: s.crop.durationDays,
    };
  });
}
