import { render } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { AppRouter } from '../src/routes/AppRouter';
import { SessionProvider } from '../src/session/SessionProvider';
import { SessionStore } from '../src/session/SessionStore';
import type { UserType } from '../src/types/api';
import { loginResponse } from './fixtures';

function CurrentLocation() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

/** Armazém de sessão em memória, já com a sessão de um utilizador do tipo indicado. */
export function signedInStore(userType: UserType): SessionStore {
  const store = new SessionStore(null);
  store.start(loginResponse(userType), 'utilizador@exemplo.pt');
  return store;
}

/** Desenha a aplicação (rotas e sessão) na rota indicada, com os serviços simulados pelo teste. */
export function renderApp(path: string, store: SessionStore = new SessionStore(null)) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider store={store}>
        <AppRouter />
        <CurrentLocation />
      </SessionProvider>
    </MemoryRouter>,
  );
  return store;
}
