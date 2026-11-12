// I073 — validação dos formulários do Administrador. O servidor volta a validar tudo (ERR-10).

/** Motivo da recusa do registo da Empresa: 10 a 500 caracteres (P12; RF094). */
export const MIN_REASON_LENGTH = 10;
export const MAX_REASON_LENGTH = 500;

/** Designação de uma competência ou de um benefício: não vazia, até 100 caracteres (API v02, 6.13.4). */
export const MAX_REFERENCE_NAME_LENGTH = 100;

/** Os espaços no início e no fim não contam (API v02, secção 2.3). Devolve a mensagem de erro ou null. */
export function rejectionReasonError(reason: string): string | null {
  const length = reason.trim().length;
  return length < MIN_REASON_LENGTH || length > MAX_REASON_LENGTH
    ? `O motivo tem de ter entre ${MIN_REASON_LENGTH} e ${MAX_REASON_LENGTH} caracteres.`
    : null;
}

/** Rejeita a designação vazia ou demasiado longa; a repetida só o servidor a conhece. */
export function referenceNameError(name: string): string | null {
  const length = name.trim().length;
  if (length === 0) {
    return 'A designação é obrigatória.';
  }
  return length > MAX_REFERENCE_NAME_LENGTH
    ? `A designação pode ter no máximo ${MAX_REFERENCE_NAME_LENGTH} caracteres.`
    : null;
}
