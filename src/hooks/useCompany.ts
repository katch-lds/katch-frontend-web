import { companyService } from '../services';
import type { CompanyRegistrationDto } from '../types/api';
import { type IResourceState, useResource } from './useResource';

// I069 — useCompany (modelo de classes do frontend web v02, secção 8.4).

const getRegistration = () => companyService.getRegistration();

/** Dados de registo da Empresa (null sem Empresa), pedidos ao abrir o ecrã do estado do pedido. */
export function useCompany(): IResourceState<CompanyRegistrationDto | null> {
  return useResource(getRegistration);
}
