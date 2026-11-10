// Espelho do ApiErrorDto e do FieldErrorDto da API v02 (documentação da API, secção 4.1).
export interface FieldErrorDto {
  field: string;
  reason: string;
}

export interface ApiErrorDto {
  code: string;
  message: string;
  fields: FieldErrorDto[];
  blockedUntil: string | null;
}
