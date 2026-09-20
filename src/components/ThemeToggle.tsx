import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

/** Bouton de bascule du thème persistant. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Changer de thème">{theme === "dark" ? <Sun /> : <Moon />}</Button>;
}