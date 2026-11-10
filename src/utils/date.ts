const dateFormat = new Intl.DateTimeFormat('pt-PT', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeFormat = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' });

/** Data e hora locais de um instante da API (UTC), no formato «05/10/2026 09:14» do protótipo. */
export function formatDateTime(iso: string): string {
  const instant = new Date(iso);
  return `${dateFormat.format(instant)} ${timeFormat.format(instant)}`;
}

/** I070 — só a data local de um instante da API, no formato «30/11/2026». */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso));
}
