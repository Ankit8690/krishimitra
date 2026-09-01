"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/I18nProvider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

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
  };
};

export default function ProfilePage() {
  const { t } = useI18n();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.replace("/login");
        else setMe(d.user);
      });
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (!me) return <div className="p-6 text-brand-mute">{t("dashboard.loading")}</div>;

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

      <Button variant="danger" className="w-full" onClick={logout}>
        <LogOut className="w-5 h-5" /> {t("common.logout")}
      </Button>
    </div>
  );
}
