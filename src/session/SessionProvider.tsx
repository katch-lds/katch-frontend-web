import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import { ApiError } from '../api/ApiError';
import { onApiError, sessionStore } from '../api';
import { authService, companyService } from '../services';
import type { CompanyStatusDto, CreateRecruiterAccountRequest, LoginRequest } from '../types/api';
import type { Session, SessionStore } from './SessionStore';

// I069 — SessionProvider (modelo de classes do frontend web v02, secções 5 e 7).

/** Estado da sessão e da Empresa do Recrutador, partilhado pelas proteções de rota e pelos ecrãs. */
export interface SessionState {
  session: Session | null;
  /** Estado da Empresa; null = ainda sem Empresa registada (só tem sentido com `companyLoaded`). */
  companyStatus: CompanyStatusDto | null;
  /** Falso enquanto o estado da Empresa de um Recrutador ainda não foi lido. */
  companyLoaded: boolean;
  companyError: ApiError | null;
  signIn: (request: LoginRequest) => Promise<void>;
  signUp: (request: CreateRecruiterAccountRequest) => Promise<void>;
  signOut: () => void;
  refreshCompanyStatus: () => Promise<void>;
}

export const SessionContext = createContext<SessionState | null>(null);

interface CompanyState {
  /** Credencial a que este estado pertence: o estado de outra sessão é ignorado. */
  token: string | null;
  status: CompanyStatusDto | null;
  loaded: boolean;
  error: ApiError | null;
}

const NO_COMPANY: CompanyState = { token: null, status: null, loaded: false, error: null };

/** Lê o estado da Empresa da sessão com esta credencial e guarda-o; um erro fica guardado para os ecrãs o mostrarem. */
async function readCompanyStatus(
  forToken: string | null,
  update: (change: (previous: CompanyState) => CompanyState) => void,
): Promise<void> {
  try {
    const status = await companyService.getStatus();
    update(() => ({ token: forToken, status, loaded: true, error: null }));
  } catch (caught) {
    const error = ApiError.from(caught);
    update((previous) => ({
      ...(previous.token === forToken ? previous : { ...NO_COMPANY, token: forToken }),
      error,
    }));
  }
}

/** Mais longo que o tempo máximo de um setTimeout (cerca de 24,8 dias). */
const MAX_TIMER_MS = 2 ** 31 - 1;

interface SessionProviderProps {
  store?: SessionStore;
  children: ReactNode;
}

export function SessionProvider({
  store = sessionStore,
  children,
}: Readonly<SessionProviderProps>) {
  const stored = useSyncExternalStore(store.subscribe, store.get);
  const session = stored !== null && !store.isExpired() ? stored : null;
  const token = session?.token ?? null;
  const isRecruiter = session?.userType === 'RECRUITER';
  const [company, setCompany] = useState<CompanyState>(NO_COMPANY);

  const refreshCompanyStatus = useCallback(
    () => readCompanyStatus(store.token(), setCompany),
    [store],
  );

  useEffect(() => {
    if (token !== null && isRecruiter) {
      void readCompanyStatus(token, setCompany);
    }
  }, [token, isRecruiter]);

  // A credencial expirada termina a sessão no cliente (o servidor não guarda estado).
  const expiresAt = stored?.expiresAt ?? null;
  useEffect(() => {
    if (expiresAt === null) {
      return undefined;
    }
    const delay = Math.min(Math.max(Date.parse(expiresAt) - Date.now(), 0), MAX_TIMER_MS);
    const timer = setTimeout(() => {
      if (store.isExpired()) {
        store.clear();
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [store, expiresAt]);

  // ERR-01 com sessão ativa: termina a sessão. ERR-07: a Empresa deixou de estar aprovada, lê-se o estado.
  useEffect(
    () =>
      onApiError((error) => {
        if (error.isUnauthorized() && error.code === 'ERR-01' && store.get() !== null) {
          store.clear();
        } else if (error.isForbidden() && error.code === 'ERR-07') {
          void refreshCompanyStatus();
        }
      }),
    [store, refreshCompanyStatus],
  );

  const signIn = useCallback(
    async (request: LoginRequest) => {
      const response = await authService.login(request);
      store.start(response, request.email);
    },
    [store],
  );

  const signUp = useCallback(
    async (request: CreateRecruiterAccountRequest) => {
      const response = await authService.createRecruiterAccount(request);
      store.start(response, request.email);
    },
    [store],
  );

  const signOut = useCallback(() => {
    // O pedido sai já com a credencial; o fim de sessão no cliente não espera pela resposta nem depende dela.
    Promise.resolve(authService.logout()).catch(() => undefined);
    store.clear();
  }, [store]);

  const own = company.token === token ? company : NO_COMPANY;
  const value = useMemo<SessionState>(
    () => ({
      session,
      companyStatus: own.status,
      companyLoaded: own.loaded,
      companyError: own.error,
      signIn,
      signUp,
      signOut,
      refreshCompanyStatus,
    }),
    [session, own.status, own.loaded, own.error, signIn, signUp, signOut, refreshCompanyStatus],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
