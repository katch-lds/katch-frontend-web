import type { AccountStatus, CompanyStatus, JobStatus } from '../types/api';
import { badgeStatusLabels } from '../types/labels';

/** Estado da Empresa, da vaga ou da conta (`BadgeStatus`), com a designação do mapa de apresentação (secção 8.1). */
export function StatusBadge({
  status,
}: Readonly<{ status: JobStatus | CompanyStatus | AccountStatus }>) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      {badgeStatusLabels[status]}
    </span>
  );
}
