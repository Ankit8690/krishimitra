import RAW_SCHEMES from "@/data/schemes.json";

export type Scheme = {
  id: string;
  name: string;
  shortName: string;
  benefit: string;
  summary: string;
  eligibility: {
    maxLandAcres: number | null;
    minLandAcres: number | null;
    landOwnerRequired: boolean;
    states: string[] | null;
    crops: string[] | null;
  };
  howToApply: string[];
  url: string;
  ministry: string;
};

const SCHEMES = RAW_SCHEMES as Scheme[];

export type FarmerContext = {
  state?: string;
  landAcres?: number;
  landOwner?: boolean;
  crops?: string[];
};

export function isEligible(scheme: Scheme, farmer: FarmerContext): boolean {
  const e = scheme.eligibility;
  if (e.landOwnerRequired && farmer.landOwner === false) return false;
  if (e.minLandAcres != null && (farmer.landAcres ?? 0) < e.minLandAcres) return false;
  if (e.maxLandAcres != null && (farmer.landAcres ?? 0) > e.maxLandAcres) return false;
  if (e.states && e.states.length > 0 && farmer.state && !e.states.includes(farmer.state))
    return false;
  if (e.crops && e.crops.length > 0 && farmer.crops) {
    const cropsLower = e.crops.map((x) => x.toLowerCase());
    const hit = farmer.crops.some((c) => cropsLower.includes(c.toLowerCase()));
    if (!hit) return false;
  }
  return true;
}

export function rankedSchemes(farmer: FarmerContext): (Scheme & { eligible: boolean })[] {
  return SCHEMES.map((s) => ({ ...s, eligible: isEligible(s, farmer) })).sort(
    (a, b) => Number(b.eligible) - Number(a.eligible)
  );
}

export function allSchemes(): Scheme[] {
  return SCHEMES;
}
