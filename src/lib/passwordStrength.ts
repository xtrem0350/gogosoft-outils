export type PasswordStrengthLabel = "Très faible" | "Faible" | "Moyen" | "Fort" | "Très fort";
export type PasswordStrengthColor = "red" | "orange" | "yellow" | "lime" | "green";

export interface PasswordStrengthResult {
  score: number;
  label: PasswordStrengthLabel;
  color: PasswordStrengthColor;
  errors: string[];
}

const MIN_LENGTH = 8;
const SPECIAL_CHARS = /[!@#$%^&*]/;
const LOWERCASE = /[a-z]/;
const UPPERCASE = /[A-Z]/;
const NUMBER = /\d/;

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const errors: string[] = [];

  if (password.length < MIN_LENGTH) {
    errors.push("Au moins 8 caractères");
  }
  if (!LOWERCASE.test(password)) {
    errors.push("Une minuscule");
  }
  if (!UPPERCASE.test(password)) {
    errors.push("Une majuscule");
  }
  if (!NUMBER.test(password)) {
    errors.push("Un chiffre");
  }
  if (!SPECIAL_CHARS.test(password)) {
    errors.push("Un caractère spécial");
  }

  let score = 0;
  if (password.length >= MIN_LENGTH) score += 1;
  if (LOWERCASE.test(password)) score += 1;
  if (UPPERCASE.test(password)) score += 1;
  if (NUMBER.test(password)) score += 1;
  if (SPECIAL_CHARS.test(password)) score += 1;

  const labelMap: Array<[number, PasswordStrengthLabel, PasswordStrengthColor]> = [
    [0, "Très faible", "red"],
    [1, "Faible", "orange"],
    [2, "Moyen", "yellow"],
    [3, "Fort", "lime"],
    [4, "Très fort", "green"],
  ];

  const safeScore = Math.min(score, 4);
  const [_, label, color] = labelMap[safeScore]!;

  return {
    score: safeScore,
    label,
    color,
    errors,
  };
}
