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
