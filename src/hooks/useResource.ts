import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../api/ApiError';

/** Contrato comum dos hooks que obtêm o recurso de um ecrã (modelo de classes do frontend web v02, secção 9). */
export interface IResourceState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  reload: () => void;
}

interface Snapshot<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

/** Pede o recurso ao montar e em cada `reload`; a resposta de um pedido ultrapassado é descartada. */
export function useResource<T>(load: () => Promise<T>): IResourceState<T> {
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({ data: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let current = true;
    load().then(
      (data) => current && setSnapshot({ data, loading: false, error: null }),
      (error: unknown) =>
        current && setSnapshot({ data: null, loading: false, error: ApiError.from(error) }),
    );
    return () => {
      current = false;
    };
  }, [load, attempt]);

  const reload = useCallback(() => {
    setSnapshot((previous) => ({ ...previous, loading: true, error: null }));
    setAttempt((value) => value + 1);
  }, []);

  return { ...snapshot, reload };
}
