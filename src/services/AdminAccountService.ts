import type { IApiClient } from '../api/IApiClient';
import type { AccountDto, CandidateAdminDto } from '../types/api';

// I073 — AdminAccountService (modelo de classes do frontend web v02, secção 5; API v02, 6.10).
export interface IAdminAccountService {
  listAccounts(): Promise<AccountDto[]>;
  listCandidates(): Promise<CandidateAdminDto[]>;
  block(userId: string): Promise<void>;
  suspendCandidate(candidateId: string): Promise<void>;
  reactivate(userId: string): Promise<void>;
}

/** Contas de utilizador e Candidatos (AdminAccountsController); só para o Administrador. */
export class AdminAccountService implements IAdminAccountService {
  constructor(private readonly api: IApiClient) {}

  /** Todas as contas, por ordem alfabética do correio eletrónico (RF085). */
  listAccounts(): Promise<AccountDto[]> {
    return this.api.get<AccountDto[]>('/api/admin/accounts');
  }

  /** Candidatos, por ordem alfabética do nome (RF088). */
  listCandidates(): Promise<CandidateAdminDto[]> {
    return this.api.get<CandidateAdminDto[]>('/api/admin/accounts/candidates');
  }

  /** Bloqueia uma conta de Candidato ou de Recrutador (RF086); 409 ERR-30 fora de `ACTIVE`. */
  async block(userId: string): Promise<void> {
    await this.api.post(`/api/admin/accounts/${encodeURIComponent(userId)}/block`);
  }

  /** Suspende a conta de um Candidato (RF089); 409 ERR-30 fora de `ACTIVE`. */
  async suspendCandidate(candidateId: string): Promise<void> {
    await this.api.post(
      `/api/admin/accounts/candidates/${encodeURIComponent(candidateId)}/suspend`,
    );
  }

  /**
   * Reativa uma conta bloqueada ou suspensa (RF087, RF090). Na lista de Candidatos usa-se o `candidateId`, que é o
   * mesmo identificador da conta (regra 9 da secção 5).
   */
  async reactivate(userId: string): Promise<void> {
    await this.api.post(`/api/admin/accounts/${encodeURIComponent(userId)}/reactivate`);
  }
}
