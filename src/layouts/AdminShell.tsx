import { Outlet, useNavigate } from 'react-router';
import { NavItem } from '../components/NavItem';
import { UserMenu } from '../components/UserMenu';
import { useSession } from '../hooks/useSession';
import { paths } from '../routes/paths';
import './shell.css';

// I069 — AdminShell mínimo (modelo de classes do frontend web v02, secção 8.1): moldura da área de supervisão.

/** Texto fixo do A02b: nenhum DTO tem o nome do Administrador. */
const ADMIN_DISPLAY_NAME = 'Administrador Katch';

/**
 * Barra lateral e barra superior com o menu do utilizador (alterar palavra-passe e terminar sessão, RF084 e RF107).
 * A barra lateral só tem os itens cujas páginas existem; Empresas, Utilizadores e Configuração entram com as Issues
 * dos respetivos ecrãs.
 */
export default function AdminShell() {
  const { session, signOut } = useSession();
  const navigate = useNavigate();
  return (
    <div className="shell">
      <nav className="shell-sidebar" aria-label="Navegação da supervisão">
        <p className="shell-brand">Katch</p>
        <NavItem to={paths.adminIndicators} label="Indicadores" />
      </nav>
      <div className="shell-content">
        <header className="shell-topbar">
          <UserMenu
            displayName={ADMIN_DISPLAY_NAME}
            email={session?.email ?? ''}
            onChangePassword={() => void navigate(paths.adminAccount)}
            onSignOut={signOut}
          />
        </header>
        <Outlet />
      </div>
    </div>
  );
}
