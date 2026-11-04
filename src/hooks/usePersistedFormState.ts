import { useEffect, useState } from "react";

export function usePersistedFormState<T extends Record<string, unknown>>(
  formKey: string,
  initialValues: T,
) {
  const storageKey = `gogosoft.form.${formKey}`;

  const [values, setValues] = useState<T>(() => {
    if (typeof window === "undefined") return initialValues;
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) return { ...initialValues, ...JSON.parse(stored) as Partial<T> };
    } catch { /* ignore */ }
    return initialValues;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(values));
    } catch { /* ignore */ }
  }, [storageKey, values]);

  const clear = () => {
    if (typeof window !== "undefined") sessionStorage.removeItem(storageKey);
    setValues(initialValues);
  };

  const setField = <K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return { values, setValues, setField, clear };
}
