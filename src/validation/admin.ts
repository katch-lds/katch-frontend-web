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

// I074 — período dos indicadores (API v02, 6.12.1): datas `aaaa-MM-dd`, inclusivas. O servidor repete estas
// verificações (ERR-10).

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Milissegundos UTC de uma data `aaaa-MM-dd` real; null se estiver mal formada ou não existir (por exemplo, 2026-02-30). */
function utcDay(date: string): number | null {
  const match = ISO_DATE.exec(date);
  if (!match) {
    return null;
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const time = Date.UTC(year, month - 1, day);
  const parsed = new Date(time);
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
    ? time
    : null;
}

/** Mensagem de erro do período ou null. `today` é a data de hoje (`todayLocal`), no mesmo formato. */
export function periodError(from: string, to: string, today: string): string | null {
  if (utcDay(from) === null || utcDay(to) === null) {
    return 'Indique a data inicial e a data final.';
  }
  if (from > to) {
    return 'A data inicial tem de ser anterior ou igual à data final.';
  }
  return to > today ? 'A data final não pode ser posterior à data de hoje.' : null;
}

/** Número de dias do período, inclusive (`from = to` dá 1); calculado em UTC, sem efeito da mudança de hora. */
export function periodDays(from: string, to: string): number {
  const start = utcDay(from);
  const end = utcDay(to);
  return start === null || end === null ? 0 : Math.round((end - start) / 86_400_000) + 1;
}

/** Soma `days` (pode ser negativo) a uma data `aaaa-MM-dd`, em UTC. */
export function addDays(date: string, days: number): string {
  const start = utcDay(date);
  return start === null ? date : new Date(start + days * 86_400_000).toISOString().slice(0, 10);
}
