import { useEffect, useState } from "react";

import type { SubscriptionSummary } from "@/services/subscriptionService";

interface SubscriptionBadgeProps {
  subscription: Pick<SubscriptionSummary, "plan" | "expires_at">;
}

function formatRemainingTime(expiresAt: string | null, now: number): string {
  if (!expiresAt) return "Durée indéterminée";

  let remaining = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return "Expiré";

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const totalDays = Math.floor(remaining / day);
  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;
  remaining %= day;
  const hours = Math.floor(remaining / hour);
  const minutes = Math.floor((remaining % hour) / minute);

  const parts: string[] = [];
  if (months > 0) parts.push(`${months} mois`);
  if (days > 0 || months === 0) parts.push(`${days} jour${days === 1 ? "" : "s"}`);
  parts.push(`${hours}h ${minutes}min`);
  return parts.join(" ");
}

export function SubscriptionBadge({ subscription }: SubscriptionBadgeProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const planLabels: Record<string, string> = {
    trial: "Free",
    mensuel: "Mensuel",
    annuel: "Annuel",
  };

  return (
    <p className="mt-3 inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1 rounded-full border border-amber-300/80 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-950 shadow-sm sm:text-sm">
      <span>Abonnement : {planLabels[subscription.plan] ?? subscription.plan}</span>
      <span aria-hidden="true">·</span>
      <span>Reste : {formatRemainingTime(subscription.expires_at, now)}</span>
    </p>
  );
}
