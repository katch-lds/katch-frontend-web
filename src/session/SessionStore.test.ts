/**
 * @jest-environment node
 */
import type { LoginResponse } from '../types/api';
import { SessionStore } from './SessionStore';

const FUTURE = '2999-01-01T08:00:00Z';
const PAST = '2000-01-01T08:00:00Z';

function response(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return { token: 'abc', userId: 'u1', userType: 'RECRUITER', expiresAt: FUTURE, ...overrides };
}

/** Implementação mínima do sessionStorage para os testes (o ambiente node não tem). */
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  };
}

function brokenStorage(): Storage {
  const fail = () => {
    throw new Error('sessionStorage indisponível');
  };
  return { length: 0, clear: fail, getItem: fail, key: fail, removeItem: fail, setItem: fail };
}

describe('SessionStore', () => {
  it('guarda a sessão iniciada e limpa-a no fim', () => {
    const store = new SessionStore(null);

    expect(store.get()).toBeNull();
    store.start(response(), 'ana@exemplo.pt');

    expect(store.get()).toEqual({ ...response(), email: 'ana@exemplo.pt' });
    expect(store.token()).toBe('abc');
    expect(store.getToken()).toBe('abc');
    store.clear();
    expect(store.get()).toBeNull();
    expect(store.getToken()).toBeNull();
  });

  it('avisa quem subscreveu em cada mudança e deixa de avisar depois de cancelar', () => {
    const store = new SessionStore(null);
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    store.start(response(), 'ana@exemplo.pt');
    store.clear();
    store.clear();
    unsubscribe();
    store.start(response(), 'ana@exemplo.pt');

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('considera expirada a credencial depois de expiresAt e deixa de a enviar', () => {
    const store = new SessionStore(null);

    expect(store.isExpired()).toBe(true);
    store.start(response({ expiresAt: '2026-11-05T18:00:00Z' }), 'ana@exemplo.pt');

    expect(store.isExpired(new Date('2026-11-05T17:59:59Z'))).toBe(false);
    expect(store.isExpired(new Date('2026-11-05T18:00:00Z'))).toBe(true);
    expect(store.token()).toBeNull();
  });

  it('trata uma data de expiração ilegível como expirada', () => {
    const store = new SessionStore(null);
    store.start(response({ expiresAt: 'não é uma data' }), 'ana@exemplo.pt');

    expect(store.isExpired()).toBe(true);
  });

  it('espelha a sessão no sessionStorage e retoma-a num novo arranque', () => {
    const storage = memoryStorage();
    new SessionStore(storage).start(response(), 'ana@exemplo.pt');

    const restored = new SessionStore(storage);

    expect(restored.get()).toEqual({ ...response(), email: 'ana@exemplo.pt' });
    restored.clear();
    expect(storage.length).toBe(0);
    expect(new SessionStore(storage).get()).toBeNull();
  });

  it('não guarda a palavra-passe: o armazenamento só tem os campos da sessão', () => {
    const storage = memoryStorage();
    new SessionStore(storage).start(response(), 'ana@exemplo.pt');

    const stored = JSON.parse(storage.getItem('katch.session') ?? '{}') as object;

    expect(Object.keys(stored).sort()).toEqual(
      ['email', 'expiresAt', 'token', 'userId', 'userType'].sort(),
    );
  });

  it('descarta no arranque uma sessão guardada que já expirou', () => {
    const storage = memoryStorage();
    new SessionStore(storage).start(response({ expiresAt: PAST }), 'ana@exemplo.pt');

    expect(new SessionStore(storage).get()).toBeNull();
    expect(storage.length).toBe(0);
  });

  it.each(['{não é json', '{"token":1}', 'null'])(
    'ignora um conteúdo guardado inválido (%s)',
    (content) => {
      const storage = memoryStorage();
      storage.setItem('katch.session', content);

      expect(new SessionStore(storage).get()).toBeNull();
    },
  );

  it('funciona só em memória quando o sessionStorage falha', () => {
    const store = new SessionStore(brokenStorage());

    expect(store.get()).toBeNull();
    store.start(response(), 'ana@exemplo.pt');
    expect(store.token()).toBe('abc');
    store.clear();
    expect(store.token()).toBeNull();
  });

  it('funciona sem sessionStorage no ambiente', () => {
    const store = new SessionStore();

    store.start(response(), 'ana@exemplo.pt');

    expect(store.token()).toBe('abc');
  });
});
