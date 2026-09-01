"use client";
import { Card } from "@/components/ui/Card";
import { TrendingUp } from "lucide-react";

export default function PricesPage() {
  return (
    <div className="max-w-md mx-auto px-5 pt-6">
      <h1 className="text-xl font-bold mb-4">Mandi prices</h1>
      <Card className="text-center py-12">
        <TrendingUp className="w-16 h-16 mx-auto text-brand-primary/60" />
        <p className="mt-4 text-brand-mute">
          Live mandi prices from data.gov.in.
          <br />
          Coming in Phase 2.
        </p>
      </Card>
    </div>
  );
}
