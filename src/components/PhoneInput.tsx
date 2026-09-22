import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface PhoneInputOption {
  code: string;
  label: string;
  flag: string;
}

const COUNTRY_OPTIONS: PhoneInputOption[] = [
  { code: "+225", label: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "+221", label: "Sénégal", flag: "🇸🇳" },
  { code: "+226", label: "Burkina", flag: "🇧🇫" },
  { code: "+223", label: "Mali", flag: "🇲🇱" },
  { code: "+233", label: "Ghana", flag: "🇬🇭" },
  { code: "+228", label: "Togo", flag: "🇹🇬" },
  { code: "+229", label: "Bénin", flag: "🇧🇯" },
  { code: "+227", label: "Niger", flag: "🇳🇪" },
  { code: "+224", label: "Guinée", flag: "🇬🇳" },
  { code: "+33", label: "France", flag: "🇫🇷" },
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
  const currentCountry = COUNTRY_OPTIONS.find((country) => country.code === defaultCountryCode) ?? COUNTRY_OPTIONS[0];
  const digits = value.replace(/\D/g, "");
  const localNumber = digits.startsWith(currentCountry.code.replace("+", "")) ? digits.slice(currentCountry.code.length - 1) : digits;

  const handleCountryChange = (nextCode: string) => {
    const nextLocale = localNumber.replace(/\D/g, "");
    onChange?.(`${nextCode}${nextLocale}`);
  };

  const handleLocalChange = (nextLocal: string) => {
    const digitsOnly = nextLocal.replace(/\D/g, "");
    onChange?.(`${currentCountry.code}${digitsOnly}`);
  };

  return (
    <div className={className ? `flex gap-2 ${className}` : "flex gap-2"}>
      <Select value={currentCountry.code} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[170px]">
          <SelectValue placeholder="Indicatif" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRY_OPTIONS.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.flag} {country.code} ({country.label})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="tel"
        value={localNumber}
        onChange={(event) => handleLocalChange(event.target.value)}
        placeholder={placeholder}
        className="flex-1"
      />
    </div>
  );
}
