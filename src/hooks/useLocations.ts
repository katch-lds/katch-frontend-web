import { referenceListService } from '../services';
import type { ReferenceItemDto } from '../types/api';
import { type IResourceState, useResource } from './useResource';

const listLocations = () => referenceListService.listLocations();

/**
 * Localidades para o registo da Empresa.
 *
 * Lista pública, pedida sem sessão.
 *
 * @returns As localidades, o estado de carregamento e `reload`.
 */
export function useLocations(): IResourceState<ReferenceItemDto[]> {
  return useResource(listLocations);
}
