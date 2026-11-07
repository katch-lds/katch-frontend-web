import { Navigate, Outlet } from 'react-router';
import { CompanyLoading } from '../components/CompanyLoading';
import { useSession } from '../hooks/useSession';
import type { CompanyStatus } from '../types/api';
import { homePath } from './paths';

// I069 — RequireCompanyStatus (modelo de classes do frontend web v02, secção 7). Proteção de navegação, não de segurança.

/** `NONE` = o Recrutador ainda não registou a Empresa. */
export type CompanyAccess = CompanyStatus | 'NONE';

/** Qualquer estado da Empresa, incluindo sem Empresa registada: só espera que o estado esteja lido. */
export const ANY_COMPANY_ACCESS: CompanyAccess[] = [
  'NONE',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'SUSPENDED',
];

/** Só deixa passar com um destes estados da Empresa; os outros vão para a página inicial do Recrutador. */
export function RequireCompanyStatus({ allow }: Readonly<{ allow: CompanyAccess[] }>) {
  const { session, companyStatus, companyLoaded } = useSession();
  if (session === null) {
    return null;
  }
  if (!companyLoaded) {
    return <CompanyLoading />;
  }
  if (allow.includes(companyStatus?.status ?? 'NONE')) {
    return <Outlet />;
  }
  return <Navigate to={homePath(session, companyStatus)} replace />;
}
