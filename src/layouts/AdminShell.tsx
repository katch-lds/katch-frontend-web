import { Outlet, useNavigate } from 'react-router';
import { NavItem } from '../components/NavItem';
import { UserMenu } from '../components/UserMenu';
import { usePendingCompanies } from '../hooks/usePendingCompanies';
import { useSession } from '../hooks/useSession';
import { paths } from '../routes/paths';
import './shell.css';

// I069 — AdminShell (modelo de classes do frontend web v02, secção 8.1): moldura da área de supervisão. I073 completa
// a barra lateral com as secções Empresas, Utilizadores e Configuração.

/** Texto fixo do A02b: nenhum DTO tem o nome do Administrador. */
const ADMIN_DISPLAY_NAME = 'Administrador Katch';

const pendingBadgeLabel = (badge: number) =>
  `${badge} ${badge === 1 ? 'Empresa pendente' : 'Empresas pendentes'}`;

/**
 * Barra lateral por secções e barra superior com o menu do utilizador (alterar palavra-passe e terminar sessão, RF084
 * e RF107). O contador de «Pendentes de aprovação» é o número de Empresas pendentes e atualiza depois de cada decisão
 * (RF091). Não há conversas nem notificações (RF103).
 */
export default function AdminShell() {
  const { session, signOut } = useSession();
  const navigate = useNavigate();
  // Se a leitura falhar, o contador não aparece: o erro é mostrado pela página aberta.
  const pendingCount = usePendingCompanies().data?.length ?? 0;
  return (
    <div className="shell">
      <nav className="shell-sidebar" aria-label="Navegação da supervisão">
        <p className="shell-brand">Katch</p>
        <NavItem to={paths.adminIndicators} label="Indicadores" />
        <p className="sidebar-section">Empresas</p>
        <NavItem
          to={paths.adminPending}
          label="Pendentes de aprovação"
          badge={pendingCount}
          badgeLabel={pendingBadgeLabel}
        />
        <NavItem to={paths.adminCompanies} label="Todas as Empresas" />
        <NavItem to={paths.adminJobs} label="Vagas publicadas" />
        <p className="sidebar-section">Utilizadores</p>
        <NavItem to={paths.adminAccounts} label="Contas de utilizador" />
        <NavItem to={paths.adminCandidates} label="Candidatos" />
        <p className="sidebar-section">Configuração</p>
        <NavItem to={paths.adminLists} label="Listas pré-definidas" />
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
