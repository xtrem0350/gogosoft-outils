import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PhoneInputOption {
  code: string;
  label: string;
  flag: string;
}

const COUNTRY_OPTIONS: PhoneInputOption[] = [
  { code: "+225", label: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "+221", label: "Sénégal", flag: "🇸🇳" },
  { code: "+223", label: "Mali", flag: "🇲🇱" },
  { code: "+226", label: "Burkina Faso", flag: "🇧🇫" },
  { code: "+229", label: "Bénin", flag: "🇧🇯" },
  { code: "+228", label: "Togo", flag: "🇹🇬" },
  { code: "+227", label: "Niger", flag: "🇳🇪" },
  { code: "+224", label: "Guinée", flag: "🇬🇳" },
  { code: "+233", label: "Ghana", flag: "🇬🇭" },
  { code: "+234", label: "Nigeria", flag: "🇳🇬" },
  { code: "+237", label: "Cameroun", flag: "🇨🇲" },
  { code: "+33", label: "France", flag: "🇫🇷" },
  { code: "+1", label: "USA/Canada", flag: "🇺🇸" },
  { code: "+212", label: "Maroc", flag: "🇲🇦" },
];

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  defaultCountryCode?: string;
  placeholder?: string;
  className?: string;
}

export function PhoneInput({
  value = "",
  onChange,
  defaultCountryCode = "+225",
  placeholder = "0700000000",
  className,
}: PhoneInputProps) {
  const resolvedCountry: PhoneInputOption = COUNTRY_OPTIONS.find(
    (country) => country.code === defaultCountryCode,
  ) ??
    COUNTRY_OPTIONS[0] ?? { code: "+225", label: "Côte d'Ivoire", flag: "🇨🇮" };
  const digits = value.replace(/\D/g, "");
  const currentCountry =
    COUNTRY_OPTIONS.find((country) => digits.startsWith(country.code.replace("+", ""))) ??
    resolvedCountry;
  const normalizedCode = currentCountry.code.replace("+", "");
  const localNumber = digits.startsWith(normalizedCode)
    ? digits.slice(normalizedCode.length)
    : digits;

  const handleCountryChange = (nextCode: string) => {
    const nextLocale = localNumber.replace(/\D/g, "");
    onChange?.(`${nextCode}${nextLocale}`);
  };

  const handleLocalChange = (nextLocal: string) => {
    const digitsOnly = nextLocal.replace(/\D/g, "");
    onChange?.(`${currentCountry.code}${digitsOnly}`);
  };

  return (
    <div className={className ? `flex gap-2 md:flex-col ${className}` : "flex gap-2 md:flex-col"}>
      <Select value={currentCountry.code} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[110px] border-white/10 bg-white/5 text-white md:w-full">
          <SelectValue placeholder="Indicatif">
            <span className="md:hidden">
              {currentCountry.flag} {currentCountry.code}
            </span>
            <span className="hidden md:inline">
              {currentCountry.flag} {currentCountry.label} {currentCountry.code}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_OPTIONS.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              <span className="md:hidden">
                {country.flag} {country.code}
              </span>
              <span className="hidden md:inline">
                {country.flag} {country.label} {country.code}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="tel"
        value={localNumber}
        onChange={(event) => handleLocalChange(event.target.value)}
        placeholder={placeholder}
        className="flex-1 border-white/10 bg-white/5 text-white placeholder:text-slate-400"
      />
    </div>
  );
}
