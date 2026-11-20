import { matchService } from '../services';
import type { MatchDto } from '../types/api';
import { type IResourceState, useResource } from './useResource';

const listMatches = () => matchService.list();

/**
 * Matches da Empresa (W21; RF067).
 *
 * Pedidos ao abrir o ecrã.
 *
 * @returns Os matches, o estado de carregamento e `reload`.
 */
export function useMatches(): IResourceState<MatchDto[]> {
  return useResource(listMatches);
}
