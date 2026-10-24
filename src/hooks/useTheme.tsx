import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "gogosoft.theme";
export type ThemeMode = "dark" | "light";

function getInitialTheme(defaultTheme: ThemeMode): ThemeMode {
  if (typeof window === "undefined") return "dark";
  if (window.innerWidth < 768) return "dark";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : defaultTheme;
}

/** Gère le mode sombre / clair et le persiste dans le navigateur. */
export function useTheme(defaultTheme: ThemeMode = "dark") {
  const [theme, setThemeState] = useState<ThemeMode>(() => getInitialTheme(defaultTheme));

  useEffect(() => {
    if (window.innerWidth < 768 && theme === "light") {
      setThemeState("dark");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }

    const handleResize = () => {
      if (window.innerWidth < 768) {
        setThemeState("dark");
        document.documentElement.classList.add("dark");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => {
    if (window.innerWidth < 768 && next === "light") {
      return;
    }
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggleTheme };
}
