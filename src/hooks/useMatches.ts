import { matchService } from '../services';
import type { MatchDto } from '../types/api';
import { type IResourceState, useResource } from './useResource';

const listMatches = () => matchService.list();

/** Matches da Empresa, pedidos ao abrir o ecrã (W21; RF067). */
export function useMatches(): IResourceState<MatchDto[]> {
  return useResource(listMatches);
}
