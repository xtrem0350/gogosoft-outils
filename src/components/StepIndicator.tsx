import { Check } from "lucide-react";

interface StepIndicatorProps {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}

export function StepIndicator({ number, label, active, completed }: StepIndicatorProps) {
  const isActive = active || completed;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex size-9 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-200 ${
          completed
            ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
            : active
              ? "border-orange-500 bg-ivoirien text-white shadow-sm"
              : "border-slate-200 bg-slate-100 text-slate-500"
        }`}
      >
        {completed ? <Check className="size-4" /> : number}
      </div>
      <span
        className={`text-sm font-medium transition-colors duration-200 ${
          isActive ? "text-slate-900" : "text-slate-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
