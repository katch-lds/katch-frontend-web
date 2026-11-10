import { ApiError } from '../api/ApiError';
import type { IApiClient } from '../api/IApiClient';
import type {
  CompanyRegistrationDto,
  CompanyRegistrationRequest,
  CompanyStatusDto,
} from '../types/api';

// I069 — CompanyService, só o registo e o estado (modelo de classes do frontend web v02, secção 4; API v02, 6.2).
export interface ICompanyService {
  register(request: CompanyRegistrationRequest): Promise<CompanyStatusDto>;
  getStatus(): Promise<CompanyStatusDto | null>;
  getRegistration(): Promise<CompanyRegistrationDto | null>;
  resubmit(request: CompanyRegistrationRequest): Promise<CompanyStatusDto>;
}

/** Empresa do Recrutador (RecruiterCompanyController). */
export class CompanyService implements ICompanyService {
  constructor(private readonly api: IApiClient) {}

  register(request: CompanyRegistrationRequest): Promise<CompanyStatusDto> {
    return this.api.post<CompanyStatusDto>('/api/recruiter/company', request);
  }

  /** Devolve null quando o Recrutador ainda não registou a Empresa (404 com ERR-20, que não é um erro). */
  getStatus(): Promise<CompanyStatusDto | null> {
    return nullWhenNoCompany(this.api.get<CompanyStatusDto>('/api/recruiter/company/status'));
  }

  /** Dados de registo da própria Empresa, em qualquer estado; null sem Empresa registada (RF044, RF045). */
  getRegistration(): Promise<CompanyRegistrationDto | null> {
    return nullWhenNoCompany(this.api.get<CompanyRegistrationDto>('/api/recruiter/company'));
  }

  /** Corrige os dados da Empresa recusada e submete-os de novo: a Empresa volta a pendente (RF045). */
  resubmit(request: CompanyRegistrationRequest): Promise<CompanyStatusDto> {
    return this.api.post<CompanyStatusDto>('/api/recruiter/company/resubmission', request);
  }
}

async function nullWhenNoCompany<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch (caught) {
    if (caught instanceof ApiError && caught.httpStatus === 404 && caught.code === 'ERR-20') {
      return null;
    }
    throw caught;
  }
}
