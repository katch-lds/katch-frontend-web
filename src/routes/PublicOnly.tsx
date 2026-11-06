import { Navigate, Outlet } from 'react-router';
import { useSession } from '../hooks/useSession';
import type { LoginArea } from '../types/LoginArea';
import { paths } from './paths';
import { SessionHome } from './SessionHome';

// I069 — PublicOnly (modelo de classes do frontend web v02, secção 7).

/**
 * Páginas só para quem ainda não iniciou sessão. Quem já tem sessão vai para a página inicial do seu perfil; o
 * Recrutador que abre o início de sessão da supervisão vai para `/acesso-negado`.
 */
export function PublicOnly({ area }: Readonly<{ area: LoginArea }>) {
  const { session } = useSession();
  if (session === null) {
    return <Outlet />;
  }
  if (area === 'Supervision' && session.userType === 'RECRUITER') {
    return <Navigate to={paths.accessDenied} replace />;
  }
  return <SessionHome />;
}
