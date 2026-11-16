import { act, renderHook, waitFor } from '@testing-library/react';
import { companyRegistrationDto, pendingCompany } from '../../test/fixtures';
import { adminCompanyService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';
import { usePendingCompanies } from './usePendingCompanies';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const { listPending, getSubmittedData, approve, reject } = adminCompanyService;

beforeEach(() => {
  resetServiceMocks();
  listPending.mockResolvedValue([pendingCompany()]);
});

describe('usePendingCompanies', () => {
  it('lê a lista de pendentes e não pede dados submetidos sem identificador', async () => {
    const { result } = renderHook(() => usePendingCompanies());
    await waitFor(() => expect(result.current.data).toEqual([pendingCompany()]));

    expect(getSubmittedData).not.toHaveBeenCalled();
    expect(result.current.selected).toBeNull();
  });

  it('com identificador lê os dados submetidos da Empresa', async () => {
    getSubmittedData.mockResolvedValue(
      companyRegistrationDto({ companyName: 'Lumen Software, Lda.' }),
    );
    const { result } = renderHook(() => usePendingCompanies('company-1'));
    await waitFor(() => expect(result.current.selected?.companyName).toBe('Lumen Software, Lda.'));

    expect(getSubmittedData).toHaveBeenCalledWith('company-1');
  });

  it('guarda o erro da leitura dos dados submetidos', async () => {
    getSubmittedData.mockRejectedValue(new ApiError(404, 'Não existe.', 'ERR-20'));
    const { result } = renderHook(() => usePendingCompanies('company-9'));
    await waitFor(() => expect(result.current.selectedError?.code).toBe('ERR-20'));

    expect(result.current.selected).toBeNull();
  });

  it('depois de aprovar lê a lista de novo', async () => {
    approve.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePendingCompanies());
    await waitFor(() => expect(result.current.data).not.toBeNull());
    listPending.mockResolvedValue([]);

    await act(async () => {
      await result.current.approve('company-1');
    });

    expect(approve).toHaveBeenCalledWith('company-1');
    await waitFor(() => expect(result.current.data).toEqual([]));
    expect(listPending).toHaveBeenCalledTimes(2);
  });

  it('uma decisão numa instância atualiza as outras (contador da barra lateral)', async () => {
    reject.mockResolvedValue(undefined);
    const page = renderHook(() => usePendingCompanies());
    const sidebar = renderHook(() => usePendingCompanies());
    await waitFor(() => expect(sidebar.result.current.data).toHaveLength(1));
    listPending.mockResolvedValue([]);

    await act(async () => {
      await page.result.current.reject('company-1', {
        reason: 'Morada não confere com a certidão.',
      });
    });

    expect(reject).toHaveBeenCalledWith('company-1', {
      reason: 'Morada não confere com a certidão.',
    });
    await waitFor(() => expect(sidebar.result.current.data).toEqual([]));
  });

  it('numa decisão rejeitada (ERR-30) propaga o erro e lê a lista de novo', async () => {
    approve.mockRejectedValue(new ApiError(409, 'Já decidida.', 'ERR-30'));
    const { result } = renderHook(() => usePendingCompanies());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    await act(async () => {
      await expect(result.current.approve('company-1')).rejects.toMatchObject({ code: 'ERR-30' });
    });

    await waitFor(() => expect(listPending).toHaveBeenCalledTimes(2));
  });
});
