import { useContext } from 'react';
import { Outlet } from 'react-router';
import { NavItem } from '../components/NavItem';
import { SignOutButton } from '../components/SignOutButton';
import { ConversationsContext, ConversationsProvider } from '../hooks/ConversationsProvider';
import { useSession } from '../hooks/useSession';
import { paths } from '../routes/paths';
import type { CompanyStatus } from '../types/api';
import './shell.css';

// I069 — RecruiterShell (modelo de classes do frontend web v02, secção 8.1 e divergências P1 e P2): moldura do
// Recrutador com barra lateral.

function Sidebar({ status }: Readonly<{ status: CompanyStatus | null }>) {
  // Sem o ConversationsProvider (Empresa pendente, recusada ou sem registo) não há contador.
  const unreadTotal = useContext(ConversationsContext)?.unreadTotal ?? 0;
  const approved = status === 'APPROVED';
  const canConverse = approved || status === 'SUSPENDED';
  return (
    <nav className="shell-sidebar" aria-label="Navegação do Recrutador">
      <p className="shell-brand">Katch</p>
      {approved && <NavItem to={paths.jobs} label="Vagas" />}
      {approved && <NavItem to={paths.candidates} label="Candidatos" />}
      {!approved && status !== null && (
        <NavItem to={paths.companyStatus} label="Estado do pedido" />
      )}
      {status === null && <NavItem to={paths.companyRegistration} label="Registo da Empresa" />}
      <NavItem to={paths.matches} label="Matches" locked={!approved} />
      <NavItem
        to={paths.conversations}
        label="Conversas"
        locked={!canConverse}
        badge={unreadTotal}
      />
      <NavItem to={paths.account} label="Conta" />
      <SignOutButton />
    </nav>
  );
}

/**
 * Barra lateral e conteúdo do Recrutador. Com a Empresa não aprovada a barra fica na variante bloqueada: Vagas e
 * Candidatos dão lugar a «Estado do pedido», o Matches fica bloqueado e as Conversas só abrem com a Empresa aprovada ou suspensa (P1 e P2); a Conta está sempre
 * acessível. O `ConversationsProvider` só monta nesses dois estados: a lista lê-se ao montar e, com a Empresa
 * pendente ou recusada, o servidor recusaria (ERR-07).
 */
export default function RecruiterShell() {
  const { session, companyStatus } = useSession();
  if (session === null) {
    return null;
  }
  const status = companyStatus?.status ?? null;
  const content = (
    <div className="shell">
      <Sidebar status={status} />
      <div className="shell-content">
        <Outlet />
      </div>
    </div>
  );
  if (status !== 'APPROVED' && status !== 'SUSPENDED') {
    return content;
  }
  return <ConversationsProvider userId={session.userId}>{content}</ConversationsProvider>;
}
