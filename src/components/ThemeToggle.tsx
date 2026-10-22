import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";

/** Bouton de bascule du thème persistant. */
export function ThemeToggle({ defaultTheme }: { defaultTheme?: ThemeMode }) {
  const { theme, toggleTheme } = useTheme(defaultTheme);
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
