import { act, renderHook, waitFor } from '@testing-library/react';
import { account } from '../../test/fixtures';
import { adminAccountService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';
import { useAccounts } from './useAccounts';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const { listAccounts, block, reactivate } = adminAccountService;

const accounts = [
  account(),
  account({ userId: 'user-2', email: 'recrutamento@lumen-exemplo.pt', userType: 'RECRUITER' }),
  account({ userId: 'user-3', email: 'rui.matos@exemplo.pt', status: 'BLOCKED' }),
  account({ userId: 'user-4', email: 'admin@katch.pt', userType: 'ADMIN' }),
];

beforeEach(() => {
  resetServiceMocks();
  listAccounts.mockResolvedValue(accounts);
});

describe('useAccounts', () => {
  it('pesquisa por correio eletrónico sem distinguir maiúsculas', async () => {
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.visibleRows).toHaveLength(4));

    act(() => result.current.search(' LUMEN '));

    expect(result.current.visibleRows.map((row) => row.userId)).toEqual(['user-2']);
    expect(result.current.emailQuery).toBe(' LUMEN ');
  });

  it('filtra por tipo e por estado, em conjunto', async () => {
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.visibleRows).toHaveLength(4));

    act(() => result.current.filter('CANDIDATE', null));
    expect(result.current.visibleRows).toHaveLength(2);

    act(() => result.current.filter('CANDIDATE', 'BLOCKED'));
    expect(result.current.visibleRows.map((row) => row.userId)).toEqual(['user-3']);
    expect(result.current.typeFilter).toBe('CANDIDATE');
    expect(result.current.statusFilter).toBe('BLOCKED');
  });

  it('pagina com 12 linhas e volta à primeira página ao pesquisar', async () => {
    listAccounts.mockResolvedValue(
      Array.from({ length: 13 }, (_, index) =>
        account({ userId: `user-${index}`, email: `pessoa${index}@exemplo.pt` }),
      ),
    );
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.pageCount).toBe(2));
    act(() => result.current.goToPage(2));
    expect(result.current.visibleRows).toHaveLength(1);

    act(() => result.current.search('pessoa'));

    expect(result.current.page).toBe(1);
    expect(result.current.visibleRows).toHaveLength(12);
  });

  it.each([
    ['block', block],
    ['reactivate', reactivate],
  ] as const)('%s lê a lista de novo depois da ação', async (operation, service) => {
    service.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    await act(async () => {
      await result.current[operation]('user-1');
    });

    expect(service).toHaveBeenCalledWith('user-1');
    await waitFor(() => expect(listAccounts).toHaveBeenCalledTimes(2));
  });

  it('numa ação rejeitada propaga o erro e também lê a lista de novo', async () => {
    block.mockRejectedValue(new ApiError(409, 'Estado inválido.', 'ERR-30'));
    const { result } = renderHook(() => useAccounts());
    await waitFor(() => expect(result.current.data).not.toBeNull());

    await act(async () => {
      await expect(result.current.block('user-1')).rejects.toMatchObject({ code: 'ERR-30' });
    });

    await waitFor(() => expect(listAccounts).toHaveBeenCalledTimes(2));
  });
});
