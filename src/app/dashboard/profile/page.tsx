"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { LogOut, Calendar } from "lucide-react";

type Me = {
  name: string;
  email: string;
  phone?: string;
  preferredLanguage: string;
  location?: { district?: string; state?: string };
  farm?: {
    landSizeAcres?: number;
    soilType?: string;
    irrigation?: string;
    primaryCrops?: string[];
    sowingDates?: Record<string, string>;
  };
};

export default function ProfilePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [dates, setDates] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) {
          router.replace("/login");
          return;
        }
        setMe(d.user);
        setDates(d.user.farm?.sowingDates ?? {});
      });
  }, [router]);

  async function saveSowing(crop: string, date: string) {
    if (!date) return;
    setSaving(crop);
    try {
      await fetch("/api/farm/sowing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop, sowingDate: date }),
      });
      setDates((d) => ({ ...d, [crop]: date }));
    } finally {
      setSaving(null);
    }
  }

  async function clearSowing(crop: string) {
    setSaving(crop);
    try {
      await fetch(`/api/farm/sowing?crop=${encodeURIComponent(crop)}`, {
        method: "DELETE",
      });
      setDates((d) => {
        const copy = { ...d };
        delete copy[crop];
        return copy;
      });
    } finally {
      setSaving(null);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (!me)
    return <div className="p-6 text-brand-mute">{t("dashboard.loading")}</div>;

  return (
    <div className="max-w-md mx-auto px-5 pt-6 space-y-4">
      <h1 className="text-xl font-bold">Profile</h1>
      <Card>
        <p className="text-brand-mute text-sm">Name</p>
        <p className="font-semibold text-lg">{me.name}</p>
        <p className="text-brand-mute text-sm mt-3">Email</p>
        <p>{me.email}</p>
        {me.phone && (
          <>
            <p className="text-brand-mute text-sm mt-3">Phone</p>
            <p>{me.phone}</p>
          </>
        )}
      </Card>

      {me.farm && (
        <Card>
          <p className="text-brand-mute text-sm">Farm</p>
          <p className="font-semibold">
            {me.farm.landSizeAcres} acres · {me.farm.soilType} soil ·{" "}
            {me.farm.irrigation}
          </p>
          {me.farm.primaryCrops && me.farm.primaryCrops.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {me.farm.primaryCrops.map((c) => (
                <span
                  key={c}
                  className="text-xs px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-medium"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}

      {me.farm?.primaryCrops && me.farm.primaryCrops.length > 0 && (
        <Card id="sowing">
          <CardTitle>
            <span className="inline-flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Sowing dates
            </span>
          </CardTitle>
          <p className="text-xs text-brand-mute mt-1 mb-3">
            Set the sowing date for each crop to unlock personalised daily tasks
            on the home screen (wheat, rice, cotton, potato, mustard, maize
            currently supported).
          </p>
          <ul className="space-y-2">
            {me.farm.primaryCrops.map((crop) => (
              <li
                key={crop}
                className="flex items-center gap-2 border-b border-brand-line pb-2 last:border-b-0 last:pb-0"
              >
                <span className="flex-1 font-medium text-sm">{crop}</span>
                <Input
                  type="date"
                  value={dates[crop] ?? ""}
                  onChange={(e) => saveSowing(crop, e.target.value)}
                  className="max-w-[10rem] h-10 text-sm"
                />
                {dates[crop] && (
                  <button
                    onClick={() => clearSowing(crop)}
                    disabled={saving === crop}
                    className="text-xs text-brand-mute hover:text-brand-danger p-1"
                    aria-label="Clear"
                  >
                    ✕
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-brand-mute text-sm">Language</p>
            <p className="font-semibold">{me.preferredLanguage}</p>
          </div>
          <Label htmlFor="lang">Change</Label>
        </div>
      </Card>

      <Button variant="danger" className="w-full" onClick={logout}>
        <LogOut className="w-5 h-5" /> {t("common.logout")}
      </Button>
    </div>
  );
}
