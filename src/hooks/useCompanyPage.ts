import { useCallback, useEffect } from 'react';
import { ApiError } from '../api/ApiError';
import { companyService } from '../services';
import type {
  CompanyPageDto,
  CompanyPageRequest,
  CompanyRegistrationDto,
  CompanyRegistrationRequest,
} from '../types/api';
import { isConflictWithCode } from '../utils/apiErrors';
import { useResource } from './useResource';
import { useSession } from './useSession';

// I121 — useCompanyPage: página de apresentação e dados de registo da Empresa aprovada (W07 e W08). O `useCompany` da
// I069 fica como está, porque o ecrã do estado do pedido usa-o.

const loadPage = () => companyService.getPage();
const loadRegistration = () => companyService.getRegistration();

export interface CompanyPageState {
  page: CompanyPageDto | null;
  registration: CompanyRegistrationDto | null;
  loading: boolean;
  error: ApiError | null;
  reload: () => void;
  savePage: (request: CompanyPageRequest) => Promise<void>;
  saveRegistration: (request: CompanyRegistrationRequest) => Promise<void>;
  uploadLogo: (file: File) => Promise<void>;
  addGalleryPhoto: (file: File) => Promise<void>;
}

function isNoLongerApproved(error: unknown): boolean {
  return error instanceof ApiError && error.isForbidden() && error.code === 'ERR-07';
}

export function useCompanyPage(): CompanyPageState {
  const { refreshCompanyStatus } = useSession();
  const pageResource = useResource(loadPage);
  const registrationResource = useResource(loadRegistration);
  const { reload: reloadPage } = pageResource;
  const { reload: reloadRegistration } = registrationResource;
  const error = pageResource.error ?? registrationResource.error;

  // ERR-07: a Empresa deixou de estar aprovada; ler o estado faz a proteção da rota encaminhar para /empresa/estado.
  useEffect(() => {
    if (isNoLongerApproved(error)) {
      void refreshCompanyStatus();
    }
  }, [error, refreshCompanyStatus]);

  const guarded = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action();
      } catch (caught) {
        if (isNoLongerApproved(caught)) {
          void refreshCompanyStatus();
        }
        throw caught;
      }
    },
    [refreshCompanyStatus],
  );

  // Depois de cada alteração volta a pedir-se a página, para mostrar o que o servidor tem (novo logótipo ou foto).
  const savePage = useCallback(
    (request: CompanyPageRequest) =>
      guarded(async () => {
        await companyService.updatePage(request);
        reloadPage();
      }),
    [guarded, reloadPage],
  );

  const saveRegistration = useCallback(
    (request: CompanyRegistrationRequest) =>
      guarded(() => companyService.updateRegistration(request)),
    [guarded],
  );

  const uploadLogo = useCallback(
    (file: File) =>
      guarded(async () => {
        await companyService.uploadLogo(file);
        reloadPage();
      }),
    [guarded, reloadPage],
  );

  const addGalleryPhoto = useCallback(
    (file: File) =>
      guarded(async () => {
        try {
          await companyService.addGalleryPhoto(file);
        } catch (caught) {
          // ERR-39: a galeria já está cheia; atualiza-se o contador e mostra-se a mensagem do servidor.
          if (isConflictWithCode(caught, 'ERR-39')) {
            reloadPage();
          }
          throw caught;
        }
        reloadPage();
      }),
    [guarded, reloadPage],
  );

  const reload = useCallback(() => {
    reloadPage();
    reloadRegistration();
  }, [reloadPage, reloadRegistration]);

  return {
    page: pageResource.data,
    registration: registrationResource.data,
    loading:
      (pageResource.loading && pageResource.data === null) ||
      (registrationResource.loading && registrationResource.data === null),
    error,
    reload,
    savePage,
    saveRegistration,
    uploadLogo,
    addGalleryPhoto,
  };
}
