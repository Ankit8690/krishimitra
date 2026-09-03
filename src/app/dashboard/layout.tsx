import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";
import { FloatingModeToggle } from "@/components/FloatingModeToggle";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="min-h-screen flex bg-brand-bg">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 pb-4 lg:pb-10">{children}</main>
        <div className="km-bottom-nav lg:hidden">
          <BottomNav />
        </div>
      </div>
      <FloatingModeToggle />
    </div>
  );
}
