import logo from "@/assets/images/profile.png";

/** Logo de marque avec apparition douce et interaction au survol. */
export function AnimatedLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="logo-enter size-11 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-white/10 p-1 shadow-lg transition-transform hover:rotate-1 hover:scale-105">
        <img loading="lazy" decoding="async"
          src={logo}
          alt="GogoSoft Technology & Solutions"
          className="size-full rounded-lg object-cover"
        />
      </div>
      {!compact && (
        <div className="logo-copy-enter min-w-0">
          <p className="truncate font-display text-sm font-semibold text-white">
            GogoSoft Technology & Solutions
          </p>
          <p className="text-xs text-white/60">Organisation & outils</p>
        </div>
      )}
    </div>
  );
}
