import { Progress } from "@/components/ui/progress";
import { checkPasswordStrength } from "@/lib/passwordStrength";

interface PasswordStrengthBarProps {
  password: string;
}

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const strength = checkPasswordStrength(password);
  const colorMap: Record<typeof strength.color, string> = {
    red: "bg-red-500",
    orange: "bg-orange-500",
    yellow: "bg-yellow-500",
    lime: "bg-lime-500",
    green: "bg-green-500",
  };

  const progress = password.trim() ? (strength.score / 4) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Force du mot de passe</span>
        <span className={`font-medium text-${strength.color}-600`}>{strength.label}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorMap[strength.color]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {strength.errors.length > 0 ? (
        <ul className="space-y-1 text-xs text-red-500">
          {strength.errors.map((error) => (
            <li key={error}>• {error}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
