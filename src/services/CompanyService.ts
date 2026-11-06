import { ApiError } from '../api/ApiError';
import type { IApiClient } from '../api/IApiClient';
import type { CompanyRegistrationRequest, CompanyStatusDto } from '../types/api';

// I069 — CompanyService, só o registo e o estado (modelo de classes do frontend web v02, secção 4; API v02, 6.2).
export interface ICompanyService {
  register(request: CompanyRegistrationRequest): Promise<CompanyStatusDto>;
  getStatus(): Promise<CompanyStatusDto | null>;
}

/** Empresa do Recrutador (RecruiterCompanyController). */
export class CompanyService implements ICompanyService {
  constructor(private readonly api: IApiClient) {}

  register(request: CompanyRegistrationRequest): Promise<CompanyStatusDto> {
    return this.api.post<CompanyStatusDto>('/api/recruiter/company', request);
  }

  /** Devolve null quando o Recrutador ainda não registou a Empresa (404 com ERR-20, que não é um erro). */
  async getStatus(): Promise<CompanyStatusDto | null> {
    try {
      return await this.api.get<CompanyStatusDto>('/api/recruiter/company/status');
    } catch (caught) {
      if (caught instanceof ApiError && caught.httpStatus === 404 && caught.code === 'ERR-20') {
        return null;
      }
      throw caught;
    }
  }
}
