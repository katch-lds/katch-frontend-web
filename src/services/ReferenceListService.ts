import type { IApiClient } from '../api/IApiClient';
import type { ReferenceItemDto, ReferenceItemRequest } from '../types/api';

// I069 — ReferenceListService: localidades (I069), competências e benefícios (I070) (modelo de classes do frontend web
// v02, secção 4; API v02, 6.13). I073 acrescenta o acrescento e a alteração, só do Administrador (RF099 a RF102).
export interface IReferenceListService {
  listLocations(): Promise<ReferenceItemDto[]>;
  listSkills(): Promise<ReferenceItemDto[]>;
  listBenefits(): Promise<ReferenceItemDto[]>;
  addSkill(request: ReferenceItemRequest): Promise<ReferenceItemDto>;
  renameSkill(skillId: string, request: ReferenceItemRequest): Promise<ReferenceItemDto>;
  addBenefit(request: ReferenceItemRequest): Promise<ReferenceItemDto>;
  renameBenefit(benefitId: string, request: ReferenceItemRequest): Promise<ReferenceItemDto>;
}

/** Listas pré-definidas (ReferenceListsController): localidades sem sessão; competências e benefícios com sessão. */
export class ReferenceListService implements IReferenceListService {
  constructor(private readonly api: IApiClient) {}

  listLocations(): Promise<ReferenceItemDto[]> {
    return this.api.get<ReferenceItemDto[]>('/api/reference-lists/locations');
  }

  listSkills(): Promise<ReferenceItemDto[]> {
    return this.api.get<ReferenceItemDto[]>('/api/reference-lists/skills');
  }

  listBenefits(): Promise<ReferenceItemDto[]> {
    return this.api.get<ReferenceItemDto[]>('/api/reference-lists/benefits');
  }

  /** I073 — acrescenta uma competência; 201 com o item criado, 400 ERR-10 se vazia ou repetida (RF099). */
  addSkill(request: ReferenceItemRequest): Promise<ReferenceItemDto> {
    return this.api.post<ReferenceItemDto>('/api/reference-lists/skills', request);
  }

  /** I073 — altera a designação de uma competência (RF100). */
  renameSkill(skillId: string, request: ReferenceItemRequest): Promise<ReferenceItemDto> {
    return this.api.put<ReferenceItemDto>(
      `/api/reference-lists/skills/${encodeURIComponent(skillId)}`,
      request,
    );
  }

  /** I073 — acrescenta um benefício (RF101). */
  addBenefit(request: ReferenceItemRequest): Promise<ReferenceItemDto> {
    return this.api.post<ReferenceItemDto>('/api/reference-lists/benefits', request);
  }

  /** I073 — altera a designação de um benefício (RF102). */
  renameBenefit(benefitId: string, request: ReferenceItemRequest): Promise<ReferenceItemDto> {
    return this.api.put<ReferenceItemDto>(
      `/api/reference-lists/benefits/${encodeURIComponent(benefitId)}`,
      request,
    );
  }
}
