import { Navigate, Outlet } from 'react-router';
import { useSession } from '../hooks/useSession';
import type { UserType } from '../types/api';
import { paths } from './paths';

// I069 — RequireUserType (modelo de classes do frontend web v02, secção 7). Proteção de navegação, não de segurança.

/** Só deixa passar o tipo de conta indicado; os outros vão para `/acesso-negado` (RF103 para as conversas). */
export function RequireUserType({ userType }: Readonly<{ userType: UserType }>) {
  const { session } = useSession();
  return session?.userType === userType ? <Outlet /> : <Navigate to={paths.accessDenied} replace />;
}
