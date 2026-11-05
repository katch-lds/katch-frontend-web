/**
 * @jest-environment node
 */
import { SessionStore } from './SessionStore';

describe('SessionStore', () => {
  it('guarda e limpa a credencial', () => {
    const store = new SessionStore();

    store.setToken('abc');
    expect(store.getToken()).toBe('abc');
    store.clear();
    expect(store.getToken()).toBeNull();
  });
});
