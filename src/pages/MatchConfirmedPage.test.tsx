import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { match } from '../../test/fixtures';
import MatchConfirmedPage from './MatchConfirmedPage';

jest.mock('../api', () => ({
  apiClient: { getFile: jest.fn().mockRejectedValue(new Error('sem ficheiro')) },
}));

function renderPage(state?: unknown) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/candidatos/match-1/match', state }]}>
      <Routes>
        <Route path="/candidatos/:matchId/match" element={<MatchConfirmedPage />} />
        <Route path="/matches" element={<p>Lista de matches</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MatchConfirmedPage', () => {
  it('mostra o nome, a vaga, a localidade e os contactos como ligações', () => {
    renderPage({ match: match(), photoUrl: null });

    expect(screen.getByRole('heading', { name: 'Match confirmado' })).toBeInTheDocument();
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Empregado de mesa')).toBeInTheDocument();
    expect(screen.getByText('Braga (Braga)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ana.silva@exemplo.pt' })).toHaveAttribute(
      'href',
      'mailto:ana.silva@exemplo.pt',
    );
    expect(screen.getByRole('link', { name: '912345678' })).toHaveAttribute(
      'href',
      'tel:912345678',
    );
  });

  it('aponta as ações para a conversa, os matches e a lista de candidatos', () => {
    renderPage({ match: match({ matchId: 'm 1' }) });

    expect(screen.getByRole('link', { name: 'Abrir conversa' })).toHaveAttribute(
      'href',
      '/conversas?match=m%201',
    );
    expect(screen.getByRole('link', { name: 'Ver matches' })).toHaveAttribute('href', '/matches');
    expect(screen.getByRole('link', { name: 'Voltar aos candidatos' })).toHaveAttribute(
      'href',
      '/candidatos',
    );
  });

  it.each([[undefined], [{}]])('sem MatchDto em state segue para os matches', (state) => {
    renderPage(state);

    expect(screen.getByText('Lista de matches')).toBeInTheDocument();
  });
});
