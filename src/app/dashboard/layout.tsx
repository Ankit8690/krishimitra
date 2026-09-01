import { BottomNav } from "@/components/BottomNav";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pb-4">{children}</main>
      <BottomNav />
    </div>
  );
}
