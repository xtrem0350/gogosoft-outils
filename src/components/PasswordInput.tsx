import { Eye, EyeOff } from "lucide-react";
import { useState, type ChangeEvent, type InputHTMLAttributes } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

/** Champ de mot de passe avec possibilité d'afficher ou masquer le texte. */
export function PasswordInput({
  value,
  onChange,
  placeholder,
  id,
  autoComplete,
  className,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        id={id}
        type={isVisible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        aria-label={isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        onClick={() => setIsVisible((current) => !current)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
      >
        {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
