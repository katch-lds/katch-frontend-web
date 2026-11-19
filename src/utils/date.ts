const dateFormat = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormat = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' });

const MS_PER_DAY = 86_400_000;

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Data e hora locais de um instante da API (UTC), no formato «05/10/2026 09:14» do protótipo. */
export function formatDateTime(iso: string): string {
  const instant = new Date(iso);
  return `${dateFormat.format(instant)} ${timeFormat.format(instant)}`;
}

/** Só a data local de um instante da API, no formato «30/11/2026». */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}

/** «hoje às 10:32» se o instante for de hoje (fuso do navegador); senão «em 09/11/2026 às 10:32». */
export function formatDayAndTime(iso: string, now: Date = new Date()): string {
  const instant = new Date(iso);
  const sameDay = instant.toDateString() === now.toDateString();
  const time = timeFormat.format(instant);
  return sameDay ? `hoje às ${time}` : `em ${dateFormat.format(instant)} às ${time}`;
}

/** `aaaa-MM-dd` → `dd/mm/aaaa`, sem passar por Date (sem efeito do fuso). */
export function formatIsoDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

/** Data local `aaaa-MM-dd` de um instante, no fuso do browser; por omissão, a data de hoje. */
export function localDate(instant: Date = new Date()): string {
  const month = String(instant.getMonth() + 1).padStart(2, '0');
  const day = String(instant.getDate()).padStart(2, '0');
  return `${instant.getFullYear()}-${month}-${day}`;
}

/**
 * Milissegundos UTC de uma data `aaaa-MM-dd` real; null se estiver mal formada ou não existir (por exemplo,
 * 2026-02-30).
 */
export function utcDay(date: string): number | null {
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

/** Número de dias do período, inclusive (`from = to` dá 1); calculado em UTC, sem efeito da mudança de hora. */
export function periodDays(from: string, to: string): number {
  const start = utcDay(from);
  const end = utcDay(to);
  return start === null || end === null ? 0 : Math.round((end - start) / MS_PER_DAY) + 1;
}

/** Soma `days` (pode ser negativo) a uma data `aaaa-MM-dd`, em UTC. */
export function addDays(date: string, days: number): string {
  const start = utcDay(date);
  return start === null ? date : new Date(start + days * MS_PER_DAY).toISOString().slice(0, 10);
}
