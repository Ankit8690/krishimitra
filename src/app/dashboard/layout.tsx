import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="km-dashboard-shell min-h-screen flex bg-brand-bg">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        {/* pb-20 on mobile leaves room for the fixed BottomNav below.
         * lg: cancels it since sidebar replaces bottom-nav on desktop. */}
        <main className="flex-1 pb-20 lg:pb-10">{children}</main>
        <div className="km-bottom-nav lg:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
