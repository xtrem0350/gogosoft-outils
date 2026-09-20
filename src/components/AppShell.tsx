import { LogOut, Search, UserRound } from "lucide-react";
import { Outlet, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { AnimatedLogo } from "@/components/AnimatedLogo";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signOut } from "@/services/authService";

/** Structure commune des pages authentifiées. */
export function AppShell({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  async function handleSignOut() {
    const { error } = await signOut();
    if (error) { toast.error(error.message); return; }
    await navigate({ to: "/auth" });
  }
  return (
    <div className="min-h-screen bg-background">
      <header className="surface-gradient flex h-20 items-center justify-between px-5 shadow-lg lg:px-8">
        <AnimatedLogo />
        <div className="flex items-center gap-1 text-white">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" aria-label="Rechercher"><Search /></Button>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" aria-label="Profil"><UserRound /></Button>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-white hover:bg-white/10 hover:text-white" aria-label="Se déconnecter"><LogOut /></Button>
        </div>
      </header>
      <div className="flex min-h-[calc(100vh-5rem)]"><Sidebar /><main className="min-w-0 flex-1 p-5 lg:p-8">{children ?? <Outlet />}</main></div>
    </div>
  );
}