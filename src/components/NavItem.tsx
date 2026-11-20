import { NavLink } from 'react-router';

interface NavItemProps {
  to: string;
  label: string;
  /** Item bloqueado (cadeado): aparece, mas não leva a lado nenhum. */
  locked?: boolean;
  /** Contador ao lado do nome, quando maior que zero. */
  badge?: number;
  /** Descrição do contador para leitores de ecrã, por omissão «n mensagens por ler». */
  badgeLabel?: (badge: number) => string;
}

const unreadMessages = (badge: number) => `${badge} mensagens por ler`;

export function NavItem({
  to,
  label,
  locked = false,
  badge = 0,
  badgeLabel = unreadMessages,
}: Readonly<NavItemProps>) {
  if (locked) {
    return (
      <span className="shell-locked" aria-disabled="true" title="Indisponível neste momento">
        {label}
      </span>
    );
  }
  return (
    <NavLink to={to}>
      {label}
      {badge > 0 && (
        <span className="shell-badge" aria-label={badgeLabel(badge)}>
          {badge}
        </span>
      )}
    </NavLink>
  );
}
