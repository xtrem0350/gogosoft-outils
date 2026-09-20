import { Menu } from "lucide-react";
import type { ReactNode } from "react";

import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import logo from "@/assets/images/profile.png";

/** Layout authentifie unique de l'application. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="surface-gradient flex min-h-20 items-center justify-between gap-4 px-5 shadow-lg lg:px-8">
          <div className="flex items-center gap-3">
            <div className="lg:hidden"><Sidebar mobileTrigger={<Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" aria-label="Ouvrir le menu"><Menu /></Button>} /></div>
            <img src={logo} alt="GogoSoft" className="size-10 rounded-xl object-cover" />
            <h1 className="truncate font-display text-lg font-semibold text-white">GogoSoft Tools Manager</h1>
          </div>
          <ThemeToggle />
        </header>
        <div className="flex-1 p-5 lg:p-8">{children}</div>
        <footer className="border-t border-border px-5 py-4 text-xs text-muted-foreground lg:px-8">
          <span className="hidden sm:inline">Développé par Thierry Gogo &amp; Co</span>
          <span className="sm:hidden">Par Thierry Gogo &amp; Co</span>
        </footer>
      </main>
    </div>
  );
}