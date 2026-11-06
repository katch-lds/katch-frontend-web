import { NavLink, Outlet } from 'react-router';
import { SignOutButton } from '../components/SignOutButton';
import { ConversationsProvider } from '../hooks/ConversationsProvider';
import { useConversations } from '../hooks/useConversations';
import { useSession } from '../hooks/useSession';
import { paths } from '../routes/paths';
import './shell.css';

// I069 — RecruiterShell (modelo de classes do frontend web v02, secção 8.1): moldura do Recrutador com barra lateral.

function Sidebar() {
  const { unreadTotal } = useConversations();
  return (
    <nav className="shell-sidebar" aria-label="Navegação do Recrutador">
      <p className="shell-brand">Katch</p>
      <NavLink to={paths.jobs}>Vagas</NavLink>
      <NavLink to={paths.matches}>Matches</NavLink>
      <NavLink to={paths.conversations}>
        Conversas
        {unreadTotal > 0 && (
          <span className="shell-badge" aria-label={`${unreadTotal} mensagens por ler`}>
            {unreadTotal}
          </span>
        )}
      </NavLink>
      <SignOutButton />
    </nav>
  );
}

/**
 * Barra lateral e conteúdo do Recrutador. Só é montada com a Empresa aprovada ou suspensa: o
 * `ConversationsProvider` lê a lista ao montar, e com a Empresa pendente o servidor recusaria (ERR-07).
 */
export default function RecruiterShell() {
  const { session } = useSession();
  if (session === null) {
    return null;
  }
  return (
    <ConversationsProvider userId={session.userId}>
      <div className="shell">
        <Sidebar />
        <div className="shell-content">
          <Outlet />
        </div>
      </div>
    </ConversationsProvider>
  );
}
