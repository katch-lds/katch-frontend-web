import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { job, waitingCandidate } from '../../test/fixtures';
import { candidateEvaluationService, jobService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';
import { formatDateTime } from '../utils/date';
import WaitingCandidatesPage from './WaitingCandidatesPage';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const listWaiting = candidateEvaluationService.listWaiting;
const JOBS = [
  job({ jobId: 'job-1', title: 'Empregado de mesa', waitingCandidates: 2 }),
  job({ jobId: 'job-2', title: 'Cozinheiro', status: 'CLOSED', waitingCandidates: 1 }),
];

function CurrentLocation() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

function renderPage(entry = '/candidatos') {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/candidatos"
          element={
            <>
              <WaitingCandidatesPage />
              <CurrentLocation />
            </>
          }
        />
        <Route path="/candidatos/:matchId" element={<CurrentLocation />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  resetServiceMocks();
  jobService.list.mockResolvedValue(JOBS);
});

describe('WaitingCandidatesPage', () => {
  it('lista os candidatos com nome, função, localidade e data, pela ordem recebida', async () => {
    listWaiting.mockResolvedValue([
      waitingCandidate({
        matchId: 'm-2',
        fullName: 'Zélia Mota',
        interestAt: '2026-10-10T08:00:00Z',
      }),
      waitingCandidate({ matchId: 'm-1', fullName: 'Ana Ferreira' }),
    ]);

    renderPage('/candidatos?vaga=job-1');

    const rows = await screen.findAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText('Zélia Mota')).toBeInTheDocument();
    expect(within(rows[1]).getByText(formatDateTime('2026-10-10T08:00:00Z'))).toBeInTheDocument();
    const second = within(rows[2]);
    expect(second.getByText('Ana Ferreira')).toBeInTheDocument();
    expect(second.getByText('Programadora backend')).toBeInTheDocument();
    expect(second.getByText('Guimarães (Braga)')).toBeInTheDocument();
    expect(second.getByText(formatDateTime('2026-10-09T15:12:40Z'))).toBeInTheDocument();
    expect(listWaiting).toHaveBeenCalledWith('job-1');
  });

  it('não tem ações de decisão na lista (RF060, RF065)', async () => {
    listWaiting.mockResolvedValue([waitingCandidate()]);
    renderPage('/candidatos?vaga=job-1');

    await screen.findByText('Ana Ferreira');

    expect(screen.queryByRole('button', { name: /aceitar|recusar/i })).toBeNull();
  });

  it('«Abrir perfil» navega para o perfil do candidato', async () => {
    listWaiting.mockResolvedValue([waitingCandidate({ matchId: 'match-9' })]);
    renderPage('/candidatos?vaga=job-1');

    fireEvent.click(await screen.findByRole('button', { name: 'Abrir perfil' }));

    expect(screen.getByTestId('location')).toHaveTextContent('/candidatos/match-9');
  });

  it('mostra o estado vazio com a vaga escolhida e lista vazia', async () => {
    renderPage('/candidatos?vaga=job-1');

    expect(
      await screen.findByText('Esta vaga ainda não tem candidatos em espera.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('sem ?vaga= pede para escolher uma vaga e não pede candidatos', async () => {
    renderPage();

    expect(await screen.findByText(/Escolha uma vaga para ver/)).toBeInTheDocument();
    expect(screen.getByLabelText('Vaga')).toHaveValue('');
    expect(listWaiting).not.toHaveBeenCalled();
  });

  it('o seletor lista as vagas em qualquer estado, com o número em espera', async () => {
    renderPage();

    expect(
      await screen.findByRole('option', { name: 'Empregado de mesa — Publicada (2 em espera)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Cozinheiro — Encerrada (1 em espera)' }),
    ).toBeInTheDocument();
  });

  it('com ?vaga= preseleciona a vaga e pede os candidatos dessa vaga', async () => {
    renderPage('/candidatos?vaga=job-2');

    await waitFor(() => expect(listWaiting).toHaveBeenCalledWith('job-2'));
    expect(screen.getByLabelText('Vaga')).toHaveValue('job-2');
  });

  it('mudar a vaga pede de novo e atualiza o endereço', async () => {
    listWaiting.mockImplementation((id: string) =>
      Promise.resolve([
        waitingCandidate({ fullName: id === 'job-1' ? 'Ana Ferreira' : 'Rui Pires' }),
      ]),
    );
    renderPage('/candidatos?vaga=job-1');
    await screen.findByText('Ana Ferreira');

    fireEvent.change(screen.getByLabelText('Vaga'), { target: { value: 'job-2' } });

    expect(await screen.findByText('Rui Pires')).toBeInTheDocument();
    expect(screen.queryByText('Ana Ferreira')).toBeNull();
    expect(listWaiting).toHaveBeenLastCalledWith('job-2');
    expect(screen.getByTestId('location')).toHaveTextContent('/candidatos?vaga=job-2');
  });

  it('voltar a «Escolha uma vaga» limpa o parâmetro', async () => {
    renderPage('/candidatos?vaga=job-1');
    await screen.findByText('Esta vaga ainda não tem candidatos em espera.');

    fireEvent.change(screen.getByLabelText('Vaga'), { target: { value: '' } });

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/candidatos$/);
    expect(await screen.findByText(/Escolha uma vaga para ver/)).toBeInTheDocument();
  });

  it('função pretendida nula mostra «—»', async () => {
    listWaiting.mockResolvedValue([waitingCandidate({ desiredRole: null })]);
    renderPage('/candidatos?vaga=job-1');

    const row = (await screen.findAllByRole('row'))[1];

    expect(within(row).getByText('—')).toBeInTheDocument();
  });

  it('mostra o erro do servidor e «Tentar de novo» repete o pedido', async () => {
    listWaiting
      .mockRejectedValueOnce(new ApiError(403, 'A vaga pertence a outra Empresa.', 'ERR-08'))
      .mockResolvedValueOnce([waitingCandidate()]);
    renderPage('/candidatos?vaga=job-1');

    expect(await screen.findByRole('alert')).toHaveTextContent('A vaga pertence a outra Empresa.');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Ana Ferreira')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(listWaiting).toHaveBeenCalledTimes(2);
  });

  it('a falha de ligação (RNF018) aparece como alerta com a mensagem do cliente da API', async () => {
    const failure = ApiError.connectionFailure();
    listWaiting.mockRejectedValue(failure);
    renderPage('/candidatos?vaga=job-1');

    expect(await screen.findByRole('alert')).toHaveTextContent(failure.message);
  });

  it('a falha ao obter as vagas aparece como alerta e permite tentar de novo', async () => {
    jobService.list.mockRejectedValueOnce(ApiError.connectionFailure()).mockResolvedValueOnce(JOBS);
    renderPage();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByLabelText('Vaga')).toBeInTheDocument();
  });

  it('?vaga= de uma vaga que não é da Empresa não pede candidatos nem seleciona nada', async () => {
    renderPage('/candidatos?vaga=job-de-outra-empresa');

    expect(await screen.findByText(/Escolha uma vaga para ver/)).toBeInTheDocument();
    expect(screen.getByLabelText('Vaga')).toHaveValue('');
    expect(listWaiting).not.toHaveBeenCalled();
  });

  it('Empresa sem vagas mostra mensagem própria', async () => {
    jobService.list.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('A Empresa ainda não tem vagas.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Vaga')).toBeNull();
    expect(listWaiting).not.toHaveBeenCalled();
  });
});
