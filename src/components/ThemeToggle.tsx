import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

/** Bouton de bascule du thème persistant. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-orange-50"
      onClick={toggleTheme}
      aria-label="Changer de thème"
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
