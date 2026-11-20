import { Navigate, Outlet } from 'react-router';
import { useSession } from '../hooks/useSession';
import type { UserType } from '../types/api';
import { paths } from './paths';

// Proteção de navegação, não de segurança: a autorização é sempre do servidor.

/**
 * Só deixa passar o tipo de conta indicado. Um Administrador numa rota do Recrutador vai para os indicadores (regra 3
 * da secção 7.2); os outros vão para `/acesso-negado` (RF104).
 */
export function RequireUserType({ userType }: Readonly<{ userType: UserType }>) {
  const { session } = useSession();
  if (session?.userType === userType) {
    return <Outlet />;
  }
  const fallback = session?.userType === 'ADMIN' ? paths.adminIndicators : paths.accessDenied;
  return <Navigate to={fallback} replace />;
}
