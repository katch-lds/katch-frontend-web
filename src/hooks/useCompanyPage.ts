import { useCallback } from 'react';
import type { ApiError } from '../api/ApiError';
import { companyService } from '../services';
import type {
  CompanyPageDto,
  CompanyPageRequest,
  CompanyRegistrationDto,
  CompanyRegistrationRequest,
} from '../types/api';
import { isConflictWithCode } from '../utils/apiErrors';
import { useCompany } from './useCompany';
import { useResource } from './useResource';

const loadPage = () => companyService.getPage();

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

/**
 * Página de apresentação e dados de registo da Empresa aprovada (W07 e W08; RF046 a RF049).
 *
 * Depois de cada alteração lê a página de novo. Um ERR-07 (a Empresa deixou de estar aprovada) é tratado pelo
 * `SessionProvider`, que lê o estado da Empresa; a proteção da rota encaminha então para `/empresa/estado`.
 *
 * @returns A página, os dados de registo, o estado de carregamento e as ações de gravar e de carregar imagens.
 */
export function useCompanyPage(): CompanyPageState {
  const pageResource = useResource(loadPage);
  const registrationResource = useCompany();
  const { reload: reloadPage } = pageResource;
  const { reload: reloadRegistration } = registrationResource;

  // Depois de cada alteração volta a pedir-se a página, para mostrar o que o servidor tem (novo logótipo ou foto).
  const savePage = useCallback(
    async (request: CompanyPageRequest) => {
      await companyService.updatePage(request);
      reloadPage();
    },
    [reloadPage],
  );

  const saveRegistration = useCallback(async (request: CompanyRegistrationRequest) => {
    await companyService.updateRegistration(request);
  }, []);

  const uploadLogo = useCallback(
    async (file: File) => {
      await companyService.uploadLogo(file);
      reloadPage();
    },
    [reloadPage],
  );

  const addGalleryPhoto = useCallback(
    async (file: File) => {
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
    },
    [reloadPage],
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
    error: pageResource.error ?? registrationResource.error,
    reload,
    savePage,
    saveRegistration,
    uploadLogo,
    addGalleryPhoto,
  };
}
