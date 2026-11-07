import { ApiError } from '../api/ApiError';

// I069 — reconhecer um conflito (409) com um código de erro da API, sem comparar texto.
export function isConflictWithCode(error: unknown, code: string): boolean {
  return error instanceof ApiError && error.isConflict() && error.code === code;
}
