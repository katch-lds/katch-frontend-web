import { Navigate, Outlet, useLocation } from 'react-router';
import { useSession } from '../hooks/useSession';
import { loginPathFor } from './paths';

// I069 — RequireSession (modelo de classes do frontend web v02, secção 7).

/** Exige sessão válida; sem ela (ou com a credencial expirada), vai para o início de sessão da área pedida. */
export function RequireSession() {
  const { session } = useSession();
  const { pathname } = useLocation();
  return session === null ? <Navigate to={loginPathFor(pathname)} replace /> : <Outlet />;
}
