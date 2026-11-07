import { referenceListService } from '../services';
import type { ReferenceItemDto } from '../types/api';
import { type IResourceState, useResource } from './useResource';

const listLocations = () => referenceListService.listLocations();

/** Localidades para o registo da Empresa (I069; lista pública). */
export function useLocations(): IResourceState<ReferenceItemDto[]> {
  return useResource(listLocations);
}
