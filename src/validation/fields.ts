// I069 — regras de validação dos campos, aplicadas antes de enviar (o servidor volta a validar tudo).

/** Erros por campo, com o nome do campo em camelCase (o mesmo que a API devolve em `fields`). */
export type FieldErrors = Record<string, string>;

export const MAX_EMAIL_LENGTH = 255;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

/** Formato `local@domínio` com uma única `@`, texto dos dois lados e um `.` no domínio; sem expressões regulares. */
export function isValidEmailFormat(value: string): boolean {
  const at = value.indexOf('@');
  if (at <= 0 || at !== value.lastIndexOf('@') || /\s/.test(value)) {
    return false;
  }
  const domain = value.slice(at + 1);
  const dot = domain.indexOf('.');
  return dot > 0 && !domain.endsWith('.');
}

export function hasLetterAndDigit(value: string): boolean {
  return /\p{L}/u.test(value) && /\d/.test(value);
}

export function isDigits(value: string, length: number): boolean {
  return value.length === length && /^\d+$/.test(value);
}

/** Obrigatório e até `max` caracteres; devolve a mensagem de erro ou null. */
export function requiredText(value: string, label: string, max: number): string | null {
  const text = value.trim();
  if (text.length === 0) {
    return `${label} é obrigatório.`;
  }
  return text.length > max ? `${label} pode ter no máximo ${max} caracteres.` : null;
}

export function emailError(value: string, label = 'O e-mail'): string | null {
  const text = value.trim();
  if (text.length === 0) {
    return `${label} é obrigatório.`;
  }
  if (text.length > MAX_EMAIL_LENGTH) {
    return `${label} pode ter no máximo ${MAX_EMAIL_LENGTH} caracteres.`;
  }
  return isValidEmailFormat(text) ? null : `${label} não tem um formato válido.`;
}

export function passwordPolicyError(value: string): string | null {
  if (value.length < MIN_PASSWORD_LENGTH || value.length > MAX_PASSWORD_LENGTH) {
    return `A palavra-passe deve ter entre ${MIN_PASSWORD_LENGTH} e ${MAX_PASSWORD_LENGTH} caracteres.`;
  }
  return hasLetterAndDigit(value)
    ? null
    : 'A palavra-passe deve ter pelo menos uma letra e um algarismo.';
}

export function digitsError(value: string, label: string, length: number): string | null {
  const text = value.trim();
  if (text.length === 0) {
    return `${label} é obrigatório.`;
  }
  return isDigits(text, length) ? null : `${label} deve ter ${length} algarismos.`;
}

/** Junta só os campos com erro. */
export function collectErrors(entries: Record<string, string | null>): FieldErrors {
  const errors: FieldErrors = {};
  for (const [field, message] of Object.entries(entries)) {
    if (message !== null) {
      errors[field] = message;
    }
  }
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
