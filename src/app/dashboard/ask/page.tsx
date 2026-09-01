"use client";
import { Card } from "@/components/ui/Card";
import { Mic } from "lucide-react";

export default function AskPage() {
  return (
    <div className="max-w-md mx-auto px-5 pt-6">
      <h1 className="text-xl font-bold mb-4">Ask AI</h1>
      <Card className="text-center py-12">
        <Mic className="w-16 h-16 mx-auto text-brand-primary/60" />
        <p className="mt-4 text-brand-mute">
          Voice-first chatbot in Hindi & Punjabi.
          <br />
          Coming in Phase 4.
        </p>
      </Card>
    </div>
  );
}
