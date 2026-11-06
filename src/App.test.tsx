import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('sem sessão, abre o início de sessão do Recrutador', () => {
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Início de sessão' })).toBeInTheDocument();
    expect(screen.getByText('Backoffice do Recrutador')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/entrar');
  });
});
