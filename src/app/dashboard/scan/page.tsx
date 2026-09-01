"use client";
import { Card } from "@/components/ui/Card";
import { ScanLine } from "lucide-react";

export default function ScanPage() {
  return (
    <div className="max-w-md mx-auto px-5 pt-6">
      <h1 className="text-xl font-bold mb-4">Disease scan</h1>
      <Card className="text-center py-12">
        <ScanLine className="w-16 h-16 mx-auto text-brand-primary/60" />
        <p className="mt-4 text-brand-mute">
          Camera + AI leaf disease detection.
          <br />
          Coming in Phase 3.
        </p>
      </Card>
    </div>
  );
}
