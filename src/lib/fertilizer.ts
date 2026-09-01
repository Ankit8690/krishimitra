import CROPS from "@/data/crops.json";

type Crop = (typeof CROPS)[number];

export type FertilizerInput = {
  cropName: string;
  currentN: number;
  currentP: number;
  currentK: number;
};

export type NutrientDose = {
  nutrient: "N" | "P" | "K";
  currentKgPerHa: number;
  targetKgPerHa: number;
  deficitKgPerHa: number; // positive = need more, negative = excess
  status: "deficient" | "adequate" | "excess";
};

export type FertilizerProduct = {
  name: string;
  bagsPerAcre: number;
  bagSizeKg: number;
  provides: { n?: number; p?: number; k?: number };
  note?: string;
};

export type FertilizerAdvice = {
  crop: string;
  doses: NutrientDose[];
  products: FertilizerProduct[];
  organicTip: string;
};

type Range = [number, number];

function statusOf(cur: number, range: Range): NutrientDose["status"] {
  if (cur < range[0]) return "deficient";
  if (cur > range[1]) return "excess";
  return "adequate";
}

// Convert kg/ha shortfall into rough bag recommendations (50 kg bags, 1 ha ≈ 2.47 acres).
// Approximate NPK content: Urea 46-0-0, DAP 18-46-0, MOP 0-0-60.
function toProducts(doses: NutrientDose[]): FertilizerProduct[] {
  const perAcreFactor = 1 / 2.47;
  const products: FertilizerProduct[] = [];

  const nDeficit = doses.find((d) => d.nutrient === "N")?.deficitKgPerHa ?? 0;
  const pDeficit = doses.find((d) => d.nutrient === "P")?.deficitKgPerHa ?? 0;
  const kDeficit = doses.find((d) => d.nutrient === "K")?.deficitKgPerHa ?? 0;

  if (pDeficit > 5) {
    const kgP = pDeficit * perAcreFactor;
    const bagsDAP = Math.max(0.5, Math.round((kgP / 0.46) / 50 * 2) / 2);
    products.push({
      name: "DAP (18-46-0)",
      bagsPerAcre: bagsDAP,
      bagSizeKg: 50,
      provides: { n: bagsDAP * 50 * 0.18, p: bagsDAP * 50 * 0.46 },
      note: "Basal application at sowing",
    });
  }

  if (kDeficit > 5) {
    const kgK = kDeficit * perAcreFactor;
    const bagsMOP = Math.max(0.5, Math.round((kgK / 0.60) / 50 * 2) / 2);
    products.push({
      name: "MOP (0-0-60)",
      bagsPerAcre: bagsMOP,
      bagSizeKg: 50,
      provides: { k: bagsMOP * 50 * 0.60 },
      note: "Apply at sowing or top-dress",
    });
  }

  // Net N need after DAP already supplied some
  const nFromDAP = products.find((p) => p.name.startsWith("DAP"))?.provides.n ?? 0;
  const nAfterDAP = Math.max(0, nDeficit * perAcreFactor - nFromDAP);
  if (nAfterDAP > 5) {
    const bagsUrea = Math.max(0.5, Math.round((nAfterDAP / 0.46) / 50 * 2) / 2);
    products.push({
      name: "Urea (46-0-0)",
      bagsPerAcre: bagsUrea,
      bagSizeKg: 50,
      provides: { n: bagsUrea * 50 * 0.46 },
      note: "Split in 2–3 top-dressings",
    });
  }
  return products;
}

export function advise(input: FertilizerInput): FertilizerAdvice | null {
  const crop = (CROPS as Crop[]).find(
    (c) => c.name.toLowerCase() === input.cropName.toLowerCase()
  );
  if (!crop) return null;

  const targetN = (crop.nRange[0] + crop.nRange[1]) / 2;
  const targetP = (crop.pRange[0] + crop.pRange[1]) / 2;
  const targetK = (crop.kRange[0] + crop.kRange[1]) / 2;

  const doses: NutrientDose[] = [
    {
      nutrient: "N",
      currentKgPerHa: input.currentN,
      targetKgPerHa: targetN,
      deficitKgPerHa: Math.round(targetN - input.currentN),
      status: statusOf(input.currentN, crop.nRange as Range),
    },
    {
      nutrient: "P",
      currentKgPerHa: input.currentP,
      targetKgPerHa: targetP,
      deficitKgPerHa: Math.round(targetP - input.currentP),
      status: statusOf(input.currentP, crop.pRange as Range),
    },
    {
      nutrient: "K",
      currentKgPerHa: input.currentK,
      targetKgPerHa: targetK,
      deficitKgPerHa: Math.round(targetK - input.currentK),
      status: statusOf(input.currentK, crop.kRange as Range),
    },
  ];

  return {
    crop: crop.name,
    doses,
    products: toProducts(doses),
    organicTip:
      crop.waterNeed === "high"
        ? "Add 4–5 tonnes/acre of well-rotted farmyard manure (FYM) before sowing."
        : "Mix 2–3 tonnes/acre of compost or vermicompost for slow-release nutrition.",
  };
}
