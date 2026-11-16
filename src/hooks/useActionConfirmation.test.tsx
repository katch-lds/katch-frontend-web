import { act, renderHook } from '@testing-library/react';
import { ApiError } from '../api/ApiError';
import { useActionConfirmation } from './useActionConfirmation';

describe('useActionConfirmation', () => {
  it('guarda o elemento à espera e cancela sem correr a ação', () => {
    const { result } = renderHook(() => useActionConfirmation<string>());

    act(() => result.current.request('company-1'));
    expect(result.current.pending).toBe('company-1');

    act(() => result.current.cancel());
    expect(result.current.pending).toBeNull();
  });

  it('confirma: corre a ação, fecha o diálogo e deixa a mensagem de sucesso', async () => {
    const action = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useActionConfirmation<string>());
    act(() => result.current.request('company-1'));

    await act(async () => {
      await result.current.confirm(action, 'Empresa suspensa.');
    });

    expect(action).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toBeNull();
    expect(result.current.busy).toBe(false);
    expect(result.current.notice).toBe('Empresa suspensa.');
    expect(result.current.failure).toBeNull();
  });

  it('numa falha fecha o diálogo e guarda o ApiError, sem mensagem de sucesso', async () => {
    const action = jest.fn().mockRejectedValue(new ApiError(409, 'Estado inválido.', 'ERR-30'));
    const { result } = renderHook(() => useActionConfirmation<string>());
    act(() => result.current.request('company-1'));

    await act(async () => {
      await result.current.confirm(action, 'Empresa suspensa.');
    });

    expect(result.current.pending).toBeNull();
    expect(result.current.notice).toBeNull();
    expect(result.current.failure?.code).toBe('ERR-30');
  });

  it('um novo pedido limpa a mensagem e a falha anteriores', async () => {
    const { result } = renderHook(() => useActionConfirmation<string>());
    await act(async () => {
      await result.current.confirm(() => Promise.resolve(), 'Feito.');
    });
    expect(result.current.notice).toBe('Feito.');

    act(() => result.current.request('company-2'));

    expect(result.current.notice).toBeNull();
  });
});
