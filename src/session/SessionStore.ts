import type { LoginResponse, UserType } from '../types/api';

// I069 — SessionStore completo (modelo de classes do frontend web v02, secção 5; decisão DF-05).

/** Sessão iniciada: a credencial, quem é e quando expira. A palavra-passe nunca é guardada. */
export interface Session {
  token: string;
  userId: string;
  userType: UserType;
  expiresAt: string;
  email: string;
}

type Listener = () => void;

const STORAGE_KEY = 'katch.session';

/**
 * Guarda a sessão em memória e espelha-a no `sessionStorage` (nunca no `localStorage`): sobrevive a recarregar o
 * separador, mas não ao seu fecho. Funciona sem `sessionStorage` (por exemplo, bloqueado pelo browser).
 */
export class SessionStore {
  private session: Session | null;

  private readonly listeners = new Set<Listener>();

  private readonly storage: Storage | null;

  constructor(storage: Storage | null = defaultStorage()) {
    this.storage = storage;
    this.session = this.restore();
  }

  /** Sessão atual, ou null. É o instantâneo lido pelo React (estável enquanto a sessão não muda). */
  readonly get = (): Session | null => this.session;

  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  start(response: LoginResponse, email: string): void {
    this.session = {
      token: response.token,
      userId: response.userId,
      userType: response.userType,
      expiresAt: response.expiresAt,
      email,
    };
    this.persist();
    this.notify();
  }

  clear(): void {
    if (this.session === null) {
      return;
    }
    this.session = null;
    this.persist();
    this.notify();
  }

  /** Credencial para o pedido; null sem sessão ou com a credencial expirada. */
  token(): string | null {
    return this.session !== null && !this.isExpired() ? this.session.token : null;
  }

  /** Usado pelo HttpApiClient. */
  getToken(): string | null {
    return this.token();
  }

  /** Sem sessão ou com a data de expiração ilegível, conta como expirada. */
  isExpired(now: Date = new Date()): boolean {
    if (this.session === null) {
      return true;
    }
    return !(Date.parse(this.session.expiresAt) > now.getTime());
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  private persist(): void {
    try {
      if (this.session === null) {
        this.storage?.removeItem(STORAGE_KEY);
      } else {
        this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.session));
      }
    } catch {
      // Sem sessionStorage (cheio ou bloqueado), a sessão fica só em memória.
    }
  }

  /** Ao arrancar, retoma a sessão do `sessionStorage` se ainda não expirou; caso contrário, descarta-a. */
  private restore(): Session | null {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY) ?? null;
      if (raw === null) {
        return null;
      }
      const parsed: unknown = JSON.parse(raw);
      if (isSession(parsed) && Date.parse(parsed.expiresAt) > Date.now()) {
        return parsed;
      }
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      // Sem sessionStorage legível, começa-se sem sessão.
    }
    return null;
  }
}

function defaultStorage(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.token === 'string' &&
    typeof candidate.userId === 'string' &&
    typeof candidate.expiresAt === 'string' &&
    typeof candidate.email === 'string' &&
    (candidate.userType === 'CANDIDATE' ||
      candidate.userType === 'RECRUITER' ||
      candidate.userType === 'ADMIN')
  );
}
