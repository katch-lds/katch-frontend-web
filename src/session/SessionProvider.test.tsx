import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { companyStatus, loginResponse } from '../../test/fixtures';
import { authService, companyService, resetServiceMocks } from '../../test/servicesMock';
import { notifyApiError } from '../api';
import { ApiError } from '../api/ApiError';
import { useSession } from '../hooks/useSession';
import { SessionProvider } from './SessionProvider';
import { SessionStore } from './SessionStore';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

function setup(store = new SessionStore(null)) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider store={store}>{children}</SessionProvider>
  );
  return { store, ...renderHook(() => useSession(), { wrapper }) };
}

beforeEach(() => resetServiceMocks());

describe('SessionProvider', () => {
  it('signIn inicia a sessão e, para o Recrutador, lê o estado da Empresa', async () => {
    authService.login.mockResolvedValue(loginResponse('RECRUITER'));
    companyService.getStatus.mockResolvedValue(companyStatus({ status: 'APPROVED' }));
    const { result, store } = setup();

    await act(() => result.current.signIn({ email: 'rui@exemplo.pt', password: 'Segredo123' }));

    expect(store.get()?.email).toBe('rui@exemplo.pt');
    await waitFor(() => expect(result.current.companyLoaded).toBe(true));
    expect(result.current.session?.userType).toBe('RECRUITER');
    expect(result.current.companyStatus?.status).toBe('APPROVED');
  });

  it('o Administrador não pede o estado da Empresa', async () => {
    authService.login.mockResolvedValue(loginResponse('ADMIN'));
    const { result } = setup();

    await act(() => result.current.signIn({ email: 'admin@exemplo.pt', password: 'x' }));

    expect(result.current.session?.userType).toBe('ADMIN');
    expect(companyService.getStatus).not.toHaveBeenCalled();
  });

  it('um login recusado deixa o erro com quem chamou e não inicia sessão', async () => {
    const error = new ApiError(401, 'Credenciais inválidas.', 'ERR-02');
    authService.login.mockRejectedValue(error);
    const { result, store } = setup();

    await expect(act(() => result.current.signIn({ email: 'a@b.pt', password: 'x' }))).rejects.toBe(
      error,
    );

    expect(store.get()).toBeNull();
  });

  it('sem Empresa registada, companyStatus fica null mas carregado', async () => {
    companyService.getStatus.mockResolvedValue(null);
    const { result } = setup(storeWith('RECRUITER'));

    await waitFor(() => expect(result.current.companyLoaded).toBe(true));
    expect(result.current.companyStatus).toBeNull();
  });

  it('signOut pede o fim de sessão e descarta a credencial mesmo que o pedido falhe', async () => {
    authService.logout.mockRejectedValue(ApiError.connectionFailure());
    companyService.getStatus.mockResolvedValue(null);
    const { result, store } = setup(storeWith('RECRUITER'));
    await waitFor(() => expect(result.current.companyLoaded).toBe(true));

    act(() => result.current.signOut());

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(store.get()).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.companyLoaded).toBe(false);
  });

  it('ERR-01 com sessão ativa termina a sessão', async () => {
    companyService.getStatus.mockResolvedValue(null);
    const { result, store } = setup(storeWith('RECRUITER'));
    await waitFor(() => expect(result.current.companyLoaded).toBe(true));

    act(() => notifyApiError(new ApiError(401, 'Sessão expirada.', 'ERR-01')));

    expect(store.get()).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it('um 401 que não é ERR-01 não termina a sessão', async () => {
    companyService.getStatus.mockResolvedValue(null);
    const { result, store } = setup(storeWith('RECRUITER'));
    await waitFor(() => expect(result.current.companyLoaded).toBe(true));

    act(() => notifyApiError(new ApiError(401, 'Credenciais inválidas.', 'ERR-02')));

    expect(store.get()).not.toBeNull();
  });

  it('ERR-07 atualiza o estado da Empresa', async () => {
    companyService.getStatus.mockResolvedValue(companyStatus({ status: 'APPROVED' }));
    const { result } = setup(storeWith('RECRUITER'));
    await waitFor(() => expect(result.current.companyStatus?.status).toBe('APPROVED'));
    companyService.getStatus.mockResolvedValue(companyStatus({ status: 'SUSPENDED' }));

    act(() => notifyApiError(new ApiError(403, 'Empresa não aprovada.', 'ERR-07')));

    await waitFor(() => expect(result.current.companyStatus?.status).toBe('SUSPENDED'));
  });

  it('falha ao ler o estado da Empresa fica em companyError até haver nova tentativa', async () => {
    companyService.getStatus.mockRejectedValueOnce(ApiError.connectionFailure());
    const { result } = setup(storeWith('RECRUITER'));

    await waitFor(() => expect(result.current.companyError).not.toBeNull());
    expect(result.current.companyLoaded).toBe(false);
    companyService.getStatus.mockResolvedValue(companyStatus());
    await act(() => result.current.refreshCompanyStatus());

    expect(result.current.companyError).toBeNull();
    expect(result.current.companyLoaded).toBe(true);
  });

  it('termina a sessão quando a credencial expira', async () => {
    jest.useFakeTimers();
    try {
      const store = new SessionStore(null);
      store.start(
        loginResponse('ADMIN', { expiresAt: new Date(Date.now() + 60_000).toISOString() }),
        'admin@exemplo.pt',
      );
      const { result } = setup(store);
      expect(result.current.session).not.toBeNull();

      await act(() => jest.advanceTimersByTimeAsync(61_000));

      expect(store.get()).toBeNull();
      expect(result.current.session).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('useSession fora do SessionProvider falha com uma mensagem clara', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useSession())).toThrow('useSession exige o SessionProvider.');
  });
});

function storeWith(userType: 'RECRUITER' | 'ADMIN') {
  const store = new SessionStore(null);
  store.start(loginResponse(userType), 'utilizador@exemplo.pt');
  return store;
}
