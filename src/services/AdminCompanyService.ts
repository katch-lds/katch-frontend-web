import type { IApiClient } from '../api/IApiClient';
import type {
  CompanyAdminDto,
  CompanyRegistrationDto,
  PendingCompanyDto,
  PublishedJobAdminDto,
  RejectCompanyRequest,
} from '../types/api';

// I073 — AdminCompanyService (modelo de classes do frontend web v02, secção 5; API v02, 6.11).
export interface IAdminCompanyService {
  listPending(): Promise<PendingCompanyDto[]>;
  getSubmittedData(companyId: string): Promise<CompanyRegistrationDto>;
  approve(companyId: string): Promise<void>;
  reject(companyId: string, request: RejectCompanyRequest): Promise<void>;
  suspend(companyId: string): Promise<void>;
  reactivate(companyId: string): Promise<void>;
  listCompanies(): Promise<CompanyAdminDto[]>;
  listPublishedJobs(): Promise<PublishedJobAdminDto[]>;
}

/** Empresas, para o Administrador (AdminCompaniesController). */
export class AdminCompanyService implements IAdminCompanyService {
  constructor(private readonly api: IApiClient) {}

  /** Empresas pendentes, da submissão mais antiga para a mais recente (RF091). */
  listPending(): Promise<PendingCompanyDto[]> {
    return this.api.get<PendingCompanyDto[]>('/api/admin/companies/pending');
  }

  /** Os oito dados submetidos e a data de submissão (RF092). */
  getSubmittedData(companyId: string): Promise<CompanyRegistrationDto> {
    return this.api.get<CompanyRegistrationDto>(
      `/api/admin/companies/${encodeURIComponent(companyId)}/registration`,
    );
  }

  /** PENDING → APPROVED (RF093); 409 ERR-30 se a Empresa já foi decidida. */
  async approve(companyId: string): Promise<void> {
    await this.api.post(`/api/admin/companies/${encodeURIComponent(companyId)}/approve`);
  }

  /** PENDING → REJECTED, com motivo de 10 a 500 caracteres (RF094; P12). */
  async reject(companyId: string, request: RejectCompanyRequest): Promise<void> {
    await this.api.post(`/api/admin/companies/${encodeURIComponent(companyId)}/reject`, request);
  }

  /** APPROVED → SUSPENDED (RF095). */
  async suspend(companyId: string): Promise<void> {
    await this.api.post(`/api/admin/companies/${encodeURIComponent(companyId)}/suspend`);
  }

  /** SUSPENDED → APPROVED (RF116). */
  async reactivate(companyId: string): Promise<void> {
    await this.api.post(`/api/admin/companies/${encodeURIComponent(companyId)}/reactivate`);
  }

  /** Todas as Empresas, por ordem alfabética (RF097). */
  listCompanies(): Promise<CompanyAdminDto[]> {
    return this.api.get<CompanyAdminDto[]>('/api/admin/companies');
  }

  /** Vagas publicadas, da publicação mais recente para a mais antiga (RF098). */
  listPublishedJobs(): Promise<PublishedJobAdminDto[]> {
    return this.api.get<PublishedJobAdminDto[]>('/api/admin/companies/published-jobs');
  }
}
