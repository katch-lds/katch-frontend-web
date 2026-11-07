import type { Session } from '../session/SessionStore';
import type { CompanyStatusDto } from '../types/api';
import type { LoginArea } from '../types/LoginArea';

// I069 — caminhos e encaminhamento por perfil (modelo de classes do frontend web v02, secção 7.2).
export const paths = {
  login: '/entrar',
  createAccount: '/criar-conta',
  adminLogin: '/admin/entrar',
  companyRegistration: '/empresa/registo',
  companyStatus: '/empresa/estado',
  company: '/empresa',
  jobs: '/vagas',
  newJob: '/vagas/nova',
  editJob: '/vagas/:jobId/editar',
  candidates: '/candidatos',
  matches: '/matches',
  conversations: '/conversas',
  adminIndicators: '/admin/indicadores',
  account: '/conta',
  adminAccount: '/admin/conta',
  accessDenied: '/acesso-negado',
} as const;

/** I070 — alteração de uma vaga (W11). */
export function editJobPath(jobId: string): string {
  return `/vagas/${encodeURIComponent(jobId)}/editar`;
}

/** Início de sessão da área a que o caminho pedido pertence. */
export function loginPathFor(pathname: string): string {
  return pathname === '/admin' || pathname.startsWith('/admin/') ? paths.adminLogin : paths.login;
}

export function loginPathForArea(area: LoginArea): string {
  return area === 'Supervision' ? paths.adminLogin : paths.login;
}

/**
 * Página inicial de quem tem sessão: o Administrador vai para os indicadores; o Recrutador, conforme a Empresa
 * (sem registo, pendente/recusada/suspensa ou aprovada). O estado da Empresa tem de estar carregado.
 */
export function homePath(session: Session, company: CompanyStatusDto | null): string {
  if (session.userType === 'ADMIN') {
    return paths.adminIndicators;
  }
  if (session.userType !== 'RECRUITER') {
    return paths.accessDenied;
  }
  if (company === null) {
    return paths.companyRegistration;
  }
  return company.status === 'APPROVED' ? paths.jobs : paths.companyStatus;
}
