import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SessionContext, type SessionState } from '../session/SessionProvider';
import { RequireCompanyStatus } from './RequireCompanyStatus';

describe('RequireCompanyStatus', () => {
  it('sem sessão não desenha nada (a RequireSession leva ao início de sessão)', () => {
    const noSession: SessionState = {
      session: null,
      companyStatus: null,
      companyLoaded: false,
      companyError: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshCompanyStatus: jest.fn(),
    };
    const { container } = render(
      <MemoryRouter>
        <SessionContext.Provider value={noSession}>
          <RequireCompanyStatus allow={['APPROVED']} />
        </SessionContext.Provider>
      </MemoryRouter>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
