import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDemoTime } from "@/services/demoService";

export function DemoBanner({ expiresAt }: { expiresAt: string | null }) {
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState(() =>
    expiresAt ? formatDemoTime(expiresAt) : "—",
  );

  useEffect(() => {
    const updateRemaining = () => {
      setRemaining(expiresAt ? formatDemoTime(expiresAt) : "—");
    };
    updateRemaining();
    const interval = window.setInterval(updateRemaining, 60_000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-10 items-center justify-center gap-2 bg-orange-500 px-2 text-white shadow-sm">
      <span className="min-w-0 truncate text-center text-xs font-semibold sm:text-sm">
        🎮 MODE TEST — Expire dans {remaining}.
      </span>
      <Button
        type="button"
        size="sm"
        onClick={() => void navigate({ to: "/auth" })}
        className="h-7 shrink-0 bg-white px-2 text-xs font-semibold text-orange-700 hover:bg-orange-50"
      >
        <UserPlus className="size-3.5" />
        Créer un compte
      </Button>
    </div>
  );
}