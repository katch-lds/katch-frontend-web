import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { match } from '../../test/fixtures';
import { ApiError } from '../api/ApiError';
import { matchService } from '../services';
import MatchesPage from './MatchesPage';

jest.mock('../services', () => ({ matchService: { list: jest.fn() } }));

const list = jest.mocked(matchService.list);

function CurrentLocation() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/matches']}>
      <Routes>
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/conversas" element={<CurrentLocation />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => list.mockReset());

describe('MatchesPage', () => {
  it('lista os matches da Empresa com vaga, Candidato, estado da vaga e contactos (RF067)', async () => {
    list.mockResolvedValue([
      match(),
      match({
        matchId: 'match-3',
        counterpartName: 'Marta Lopes',
        jobTitle: 'Assistente de loja',
        jobStatus: 'CLOSED',
        contactEmail: 'marta.lopes@exemplo.pt',
        contactPhone: '914567890',
      }),
    ]);

    renderPage();

    const rows = await screen.findAllByRole('row');
    expect(rows).toHaveLength(3);
    const ana = within(rows[1]);
    expect(ana.getByText('Ana Silva')).toBeInTheDocument();
    expect(ana.getByText('Empregado de mesa')).toBeInTheDocument();
    expect(ana.getByText('Publicada')).toBeInTheDocument();
    expect(ana.getByText('ana.silva@exemplo.pt')).toBeInTheDocument();
    expect(ana.getByText('912345678')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Encerrada')).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(1);
  });

  it('abre a conversa associada ao match', async () => {
    list.mockResolvedValue([match({ matchId: 'match-7' })]);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Abrir conversa' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/conversas?match=match-7');
  });

  it('indica a lista vazia', async () => {
    list.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText(/Ainda não há matches/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('mostra a recusa do servidor e permite tentar de novo', async () => {
    list
      .mockRejectedValueOnce(new ApiError(403, 'A Empresa não está aprovada.', 'ERR-07'))
      .mockResolvedValueOnce([match()]);
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('A Empresa não está aprovada.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Ana Silva')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
