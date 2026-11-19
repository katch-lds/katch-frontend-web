import { ApiError } from '../api/ApiError';
import type { IApiClient } from '../api/IApiClient';
import type {
  CompanyPageDto,
  CompanyPageRequest,
  CompanyRegistrationDto,
  CompanyRegistrationRequest,
  CompanyStatusDto,
} from '../types/api';

/**
 * Empresa do Recrutador: registo, estado, dados de registo, página de apresentação, logótipo e galeria
 * (RecruiterCompanyController; API v02, 6.2 e 6.4).
 */
export class CompanyService {
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

  /** Altera os dados de registo da Empresa aprovada; o NIF tem de ser igual ao registado (RF049). */
  updateRegistration(request: CompanyRegistrationRequest): Promise<CompanyStatusDto> {
    return this.api.put<CompanyStatusDto>('/api/recruiter/company', request);
  }

  /** Página de apresentação da própria Empresa aprovada (RF046 a RF048). */
  getPage(): Promise<CompanyPageDto> {
    return this.api.get<CompanyPageDto>('/api/recruiter/company/page');
  }

  /** Grava a descrição e o sítio; `null` limpa o campo (RF046). */
  updatePage(request: CompanyPageRequest): Promise<CompanyPageDto> {
    return this.api.put<CompanyPageDto>('/api/recruiter/company/page', request);
  }

  /** Substitui o logótipo; devolve o endereço do ficheiro (RF047). */
  uploadLogo(file: File): Promise<string | null> {
    return this.api.upload('PUT', '/api/recruiter/company/logo', file);
  }

  /** Acrescenta uma fotografia no fim da galeria; devolve o endereço do ficheiro (RF048). */
  addGalleryPhoto(file: File): Promise<string | null> {
    return this.api.upload('POST', '/api/recruiter/company/photos', file);
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
