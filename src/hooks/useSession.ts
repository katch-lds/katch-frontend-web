import { useContext } from 'react';
import { SessionContext, type SessionState } from '../session/SessionProvider';

/** Lê a sessão, o estado da Empresa e as ações de início e fim de sessão (I069). */
export function useSession(): SessionState {
  const state = useContext(SessionContext);
  if (state === null) {
    throw new Error('useSession exige o SessionProvider.');
  }
  return state;
}
