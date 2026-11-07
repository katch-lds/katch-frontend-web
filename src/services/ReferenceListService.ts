import type { IApiClient } from '../api/IApiClient';
import type { ReferenceItemDto } from '../types/api';

// I069 — ReferenceListService, só as localidades (modelo de classes do frontend web v02, secção 4; API v02, 6.9).
export interface IReferenceListService {
  listLocations(): Promise<ReferenceItemDto[]>;
}

/** Listas de referência públicas (ReferenceListsController). */
export class ReferenceListService implements IReferenceListService {
  constructor(private readonly api: IApiClient) {}

  listLocations(): Promise<ReferenceItemDto[]> {
    return this.api.get<ReferenceItemDto[]>('/api/reference-lists/locations');
  }
}
