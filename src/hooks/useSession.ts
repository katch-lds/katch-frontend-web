import { useContext } from 'react';
import { SessionContext, type SessionState } from '../session/SessionProvider';

/**
 * Sessão, estado da Empresa e ações de início e fim de sessão.
 *
 * Exige o `SessionProvider`.
 *
 * @returns O estado e as ações do `SessionProvider`.
 */
export function useSession(): SessionState {
  const state = useContext(SessionContext);
  if (state === null) {
    throw new Error('useSession exige o SessionProvider.');
  }
  return state;
}
