import { useCallback } from 'react';
import { referenceListService } from '../services';
import type { ReferenceItemDto, ReferenceItemRequest } from '../types/api';
import { type IResourceState, useResource } from './useResource';

export interface EditableReferenceLists {
  skills: ReferenceItemDto[];
  benefits: ReferenceItemDto[];
}

export interface ReferenceListsAdmin extends IResourceState<EditableReferenceLists> {
  addSkill: (request: ReferenceItemRequest) => Promise<void>;
  renameSkill: (skillId: string, request: ReferenceItemRequest) => Promise<void>;
  addBenefit: (request: ReferenceItemRequest) => Promise<void>;
  renameBenefit: (benefitId: string, request: ReferenceItemRequest) => Promise<void>;
}

async function loadLists(): Promise<EditableReferenceLists> {
  const [skills, benefits] = await Promise.all([
    referenceListService.listSkills(),
    referenceListService.listBenefits(),
  ]);
  return { skills, benefits };
}

/**
 * Listas pré-definidas editáveis pelo Administrador (A09; RF099 a RF102).
 *
 * Competências e benefícios, com acrescento, alteração e nova leitura depois de cada operação. As localidades são só
 * de leitura e não aparecem neste ecrã; o Recrutador lê as listas pelo `useJobFormData`.
 *
 * @returns As duas listas, o estado de carregamento e as ações de acrescentar e alterar.
 */
export function useReferenceLists(): ReferenceListsAdmin {
  const resource = useResource(loadLists);
  const { reload } = resource;

  /** Só lê de novo quando a operação resulta: numa rejeição (designação repetida), a lista não mudou. */
  const thenReload = useCallback(
    async (operation: Promise<ReferenceItemDto>) => {
      await operation;
      reload();
    },
    [reload],
  );

  return {
    ...resource,
    addSkill: (request) => thenReload(referenceListService.addSkill(request)),
    renameSkill: (skillId, request) =>
      thenReload(referenceListService.renameSkill(skillId, request)),
    addBenefit: (request) => thenReload(referenceListService.addBenefit(request)),
    renameBenefit: (benefitId, request) =>
      thenReload(referenceListService.renameBenefit(benefitId, request)),
  };
}
