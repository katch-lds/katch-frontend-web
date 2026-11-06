import type { JobStatus } from '../types/api';
import { jobStatusLabels } from '../types/labels';

/** Estado em etiqueta, com a designação do mapa de apresentação (secção 8.1). */
export function StatusBadge({ status }: Readonly<{ status: JobStatus }>) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>{jobStatusLabels[status]}</span>
  );
}
