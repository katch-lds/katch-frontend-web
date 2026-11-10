import type { IApiClient } from '../api/IApiClient';
import type { ReferenceItemDto } from '../types/api';

// I069 — ReferenceListService: localidades (I069), competências e benefícios (I070) (modelo de classes do frontend web
// v02, secção 4; API v02, 6.13).
export interface IReferenceListService {
  listLocations(): Promise<ReferenceItemDto[]>;
  listSkills(): Promise<ReferenceItemDto[]>;
  listBenefits(): Promise<ReferenceItemDto[]>;
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
}
