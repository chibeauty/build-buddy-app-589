import { ReactNode } from "react";
import { TopNav } from "./TopNav";
import { BottomNav } from "./BottomNav";

interface MainLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export function MainLayout({ children, showBottomNav = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <main className="flex-1 pb-20 md:pb-4">
        {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
