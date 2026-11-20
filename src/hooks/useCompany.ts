import { companyService } from '../services';
import type { CompanyRegistrationDto } from '../types/api';
import { type IResourceState, useResource } from './useResource';

const getRegistration = () => companyService.getRegistration();

/**
 * Dados de registo da Empresa do Recrutador.
 *
 * Pedidos ao abrir o ecrã do estado do pedido (W05, W06 e W26).
 *
 * @returns Os dados de registo (null sem Empresa), o estado de carregamento e `reload`.
 */
export function useCompany(): IResourceState<CompanyRegistrationDto | null> {
  return useResource(getRegistration);
}
