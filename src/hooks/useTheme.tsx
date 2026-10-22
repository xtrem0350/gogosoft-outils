import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "gogosoft.theme";
export type ThemeMode = "dark" | "light";

/** Gère le mode sombre / clair et le persiste dans le navigateur. */
export function useTheme(defaultTheme: ThemeMode = "dark") {
  const [theme, setThemeState] = useState<ThemeMode>(defaultTheme);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const initial: ThemeMode = stored ?? defaultTheme;
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, [defaultTheme]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
