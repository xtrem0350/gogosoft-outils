import { useEffect, useState } from "react";

export function usePersistedWizardState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = sessionStorage.getItem(`gogosoft.wizard.${key}`);
      if (stored) return JSON.parse(stored) as T;
    } catch { /* ignore */ }
    return initialValue;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(`gogosoft.wizard.${key}`, JSON.stringify(state));
    } catch { /* ignore */ }
  }, [key, state]);

  const clear = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(`gogosoft.wizard.${key}`);
    }
    setState(initialValue);
  };

  return [state, setState, clear] as const;
}
