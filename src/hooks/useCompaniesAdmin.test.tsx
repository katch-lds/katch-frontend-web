import { act, renderHook, waitFor } from '@testing-library/react';
import { companyAdmin } from '../../test/fixtures';
import { adminCompanyService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';
import { useCompaniesAdmin } from './useCompaniesAdmin';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const { listCompanies, suspend, reactivate } = adminCompanyService;

const companies = [
  companyAdmin(),
  companyAdmin({ companyId: 'company-2', companyName: 'Café Central, Lda.', status: 'SUSPENDED' }),
  companyAdmin({ companyId: 'company-3', companyName: 'Padaria Sol, Lda.', status: 'PENDING' }),
];

beforeEach(() => {
  resetServiceMocks();
  listCompanies.mockResolvedValue(companies);
});

describe('useCompaniesAdmin', () => {
  it('mostra todas as Empresas e filtra por estado', async () => {
    const { result } = renderHook(() => useCompaniesAdmin());
    await waitFor(() => expect(result.current.visibleRows).toHaveLength(3));

    act(() => result.current.filterByStatus('SUSPENDED'));
    expect(result.current.visibleRows.map((row) => row.companyId)).toEqual(['company-2']);
    expect(result.current.statusFilter).toBe('SUSPENDED');

    act(() => result.current.filterByStatus(null));
    expect(result.current.visibleRows).toHaveLength(3);
  });

  it.each([
    ['suspend', suspend],
    ['reactivate', reactivate],
  ] as const)('%s lê a lista de novo depois da ação', async (operation, service) => {
    service.mockResolvedValue(undefined);
    const { result } = renderHook(() => useCompaniesAdmin());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    await act(async () => {
      await result.current[operation]('company-1');
    });

    expect(service).toHaveBeenCalledWith('company-1');
    await waitFor(() => expect(listCompanies).toHaveBeenCalledTimes(2));
  });

  it('numa ação rejeitada propaga o erro e também lê a lista de novo', async () => {
    suspend.mockRejectedValue(new ApiError(409, 'Estado inválido.', 'ERR-30'));
    const { result } = renderHook(() => useCompaniesAdmin());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    await act(async () => {
      await expect(result.current.suspend('company-1')).rejects.toMatchObject({ httpStatus: 409 });
    });

    await waitFor(() => expect(listCompanies).toHaveBeenCalledTimes(2));
  });
});
