import { RotateCw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

export type Orientation = "portrait" | "landscape";

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(() =>
    typeof window !== "undefined" && window.matchMedia("(orientation: portrait)").matches
      ? "portrait"
      : "landscape",
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(orientation: portrait)");
    const updateOrientation = () => {
      setOrientation(mediaQuery.matches ? "portrait" : "landscape");
    };

    updateOrientation();
    mediaQuery.addEventListener("change", updateOrientation);
    return () => mediaQuery.removeEventListener("change", updateOrientation);
  }, []);

  return orientation;
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false,
  );

  useEffect(() => {
    const updateWidth = () => setIsMobile(window.innerWidth < 768);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  return isMobile;
}

export function OrientationGuard({ children }: { children: ReactNode }) {
  const orientation = useOrientation();
  const isMobile = useIsMobile();

  if (isMobile && orientation === "portrait") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900 px-8 text-center text-white">
        <RotateCw className="mb-5 size-12 text-orange-500" aria-hidden="true" />
        <p className="max-w-md text-lg font-semibold">
          📱 Tournez votre téléphone en mode paysage pour une meilleure expérience.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
