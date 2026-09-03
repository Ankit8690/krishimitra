import CALENDAR from "@/data/cropCalendar.json";

type Stage = { das: [number, number]; en: string; hi: string; pa: string };

const CAL = CALENDAR as unknown as Record<string, Stage[]>;

export type FarmerCropTask = {
  crop: string;
  sowingDate: string;
  daysSince: number;
  stageRange: [number, number];
  text: string;
};

/**
 * Return today's task per crop for a farmer with sowing dates set.
 * Falls back to a friendly nudge for crops without sowing dates.
 */
export function todaysTasks(
  farmerCrops: { crop: string; sowingDate?: string }[],
  language: "en" | "hi" | "pa" = "en",
  today: Date = new Date()
): FarmerCropTask[] {
  const out: FarmerCropTask[] = [];
  for (const { crop, sowingDate } of farmerCrops) {
    if (!sowingDate) continue;
    const stages = CAL[crop];
    if (!stages) continue;

    const sown = new Date(sowingDate);
    if (Number.isNaN(sown.getTime())) continue;

    const daysSince = Math.floor(
      (today.getTime() - sown.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince < 0) {
      out.push({
        crop,
        sowingDate,
        daysSince,
        stageRange: [0, 0],
        text:
          language === "hi"
            ? `${crop} की बुवाई ${Math.abs(daysSince)} दिन बाद है।`
            : language === "pa"
              ? `${crop} ਦੀ ਬਿਜਾਈ ${Math.abs(daysSince)} ਦਿਨ ਬਾਅਦ।`
              : `${crop} sowing is in ${Math.abs(daysSince)} days.`,
      });
      continue;
    }

    // Find the current stage or the closest upcoming one
    const stage =
      stages.find((s) => daysSince >= s.das[0] && daysSince <= s.das[1]) ??
      stages.find((s) => s.das[0] > daysSince);
    if (!stage) {
      out.push({
        crop,
        sowingDate,
        daysSince,
        stageRange: [0, 0],
        text:
          language === "hi"
            ? `${crop} की फसल पूरी हो गई है (बुवाई के ${daysSince} दिन बाद)।`
            : language === "pa"
              ? `${crop} ਦੀ ਫਸਲ ਖਤਮ ਹੋ ਗਈ ਹੈ।`
              : `${crop} cycle should be complete (${daysSince} days since sowing).`,
      });
      continue;
    }

    const text = stage[language] ?? stage.en;
    out.push({
      crop,
      sowingDate,
      daysSince,
      stageRange: stage.das,
      text,
    });
  }
  return out;
}

export function supportedCropsForCalendar(): string[] {
  return Object.keys(CAL);
}
