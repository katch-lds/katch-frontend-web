import { useCallback } from 'react';
import { referenceListService } from '../services';
import type { ReferenceItemDto, ReferenceItemRequest } from '../types/api';
import { type IResourceState, useResource } from './useResource';

// I073 — listas pré-definidas do Administrador (A09; RF099 a RF102): competências e benefícios, com acrescento e
// alteração e nova leitura depois de cada operação. As localidades são só de leitura e não aparecem neste ecrã. O
// Recrutador continua a ler as listas pelo `useJobFormData`.

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

export function useReferenceLists(): ReferenceListsAdmin {
  const resource = useResource(loadLists);
  const { reload } = resource;

  /** A leitura repete-se só quando a operação resulta; numa rejeição (designação repetida) a lista não mudou. */
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
