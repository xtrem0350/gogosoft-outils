import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CashPeriod } from "@/services/cashService";

export type PeriodPreset = "today" | "week" | "month" | "custom";

interface CaissePeriodSelectorProps {
  preset: PeriodPreset;
  onPresetChange: (preset: PeriodPreset) => void;
  customStart: string;
  customEnd: string;
  onCustomChange: (start: string, end: string) => void;
  period: CashPeriod;
}

export function CaissePeriodSelector({
  preset,
  onPresetChange,
  customStart,
  customEnd,
  onCustomChange,
  period,
}: CaissePeriodSelectorProps) {
  return (
    <Card className="card-3d rounded-xl">
      <CardContent className="flex flex-wrap items-end gap-3 p-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Période caisse">
          {([
            ["today", "Aujourd'hui"],
            ["week", "Cette semaine"],
            ["month", "Ce mois"],
            ["custom", "Personnalisé"],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant={preset === value ? "default" : "outline"}
              aria-pressed={preset === value}
              onClick={() => onPresetChange(value)}
              className={preset === value ? "bg-ivoirien text-white shadow-3d" : ""}
            >
              {label}
            </Button>
          ))}
        </div>
        {preset === "custom" ? (
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Du
              <Input type="date" value={customStart} onChange={(event) => onCustomChange(event.target.value, customEnd)} className="h-10 w-40" />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Au
              <Input type="date" value={customEnd} onChange={(event) => onCustomChange(customStart, event.target.value)} className="h-10 w-40" />
            </label>
          </div>
        ) : null}
        <p className="ml-auto inline-flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" /> {period.start.toLocaleDateString("fr-FR")} – {period.end.toLocaleDateString("fr-FR")}
        </p>
      </CardContent>
    </Card>
  );
}
