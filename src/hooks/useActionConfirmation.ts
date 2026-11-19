import { useCallback, useState } from 'react';
import { ApiError } from '../api/ApiError';

export interface ActionConfirmation<T> {
  /** Elemento à espera de confirmação; null com o diálogo fechado. */
  pending: T | null;
  busy: boolean;
  notice: string | null;
  failure: ApiError | null;
  request: (item: T) => void;
  cancel: () => void;
  /** Corre a ação confirmada e fecha o diálogo; a falha fica em `failure` e o sucesso em `notice`. */
  confirm: (action: () => Promise<void>, done: string) => Promise<void>;
}

/**
 * Ação do Administrador que pede confirmação (ConfirmDialog; A04b, A05b, A07b, A07c e A08b).
 *
 * Guarda o elemento `T` à espera de confirmação, o pedido em curso, a mensagem de sucesso e a falha.
 *
 * @returns O estado do diálogo e as funções para pedir, cancelar e confirmar a ação.
 */
export function useActionConfirmation<T>(): ActionConfirmation<T> {
  const [pending, setPending] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<ApiError | null>(null);

  const request = useCallback((item: T) => {
    setNotice(null);
    setFailure(null);
    setPending(item);
  }, []);

  const cancel = useCallback(() => setPending(null), []);

  const confirm = useCallback(async (action: () => Promise<void>, done: string) => {
    setBusy(true);
    setNotice(null);
    setFailure(null);
    try {
      await action();
      setNotice(done);
    } catch (caught) {
      setFailure(ApiError.from(caught));
    } finally {
      setPending(null);
      setBusy(false);
    }
  }, []);

  return { pending, busy, notice, failure, request, cancel, confirm };
}
