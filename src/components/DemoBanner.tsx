import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatDemoTime } from "@/services/demoService";

export function DemoBanner({
  expiresAt,
  onCreateAccount,
}: {
  expiresAt: string | null;
  onCreateAccount: () => void;
}) {
  const [remaining, setRemaining] = useState(() =>
    expiresAt ? formatDemoTime(expiresAt) : "—",
  );

  useEffect(() => {
    const updateRemaining = () => {
      setRemaining(expiresAt ? formatDemoTime(expiresAt) : "—");
    };
    updateRemaining();
    const interval = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex h-10 items-center justify-center gap-2 bg-orange-500 px-2 text-white shadow-sm">
      <span className="min-w-0 truncate text-center text-xs font-semibold sm:text-sm">
        Mode démo — données fictives · Expire dans {remaining}
      </span>
      <Button
        type="button"
        size="sm"
        onClick={onCreateAccount}
        className="h-7 shrink-0 bg-white px-2 text-xs font-semibold text-orange-800 hover:bg-orange-50"
      >
        Créer mon compte
      </Button>
    </div>
  );
}