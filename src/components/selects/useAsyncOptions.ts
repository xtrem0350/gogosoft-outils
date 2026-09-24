import { useEffect, useState } from "react";

/** Charge une liste une fois par clé (évite les rechargements à chaque rendu). */
export function useAsyncList<T>(key: string | null, loader: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!key) {
      setItems([]);
      return;
    }
    let active = true;
    setLoading(true);
    loader()
      .then((next) => {
        if (active) setItems(next);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { items, loading };
}
