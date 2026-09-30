import { useNavigate } from "@tanstack/react-router";
import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HelpButton() {
  const navigate = useNavigate();

  return (
    <Button
      type="button"
      size="icon"
      variant="default"
      aria-label="Besoin d'aide ?"
      title="Besoin d'aide ?"
      onClick={() => void navigate({ to: "/aide" as any })}
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-ivoirien shadow-3d transition-all hover:scale-105 hover:bg-ivoirien-hover"
    >
      <HelpCircle className="size-6 text-white" />
    </Button>
  );
}
