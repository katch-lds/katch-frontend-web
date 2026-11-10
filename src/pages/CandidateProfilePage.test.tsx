import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { StrictMode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { candidateProfile, match } from '../../test/fixtures';
import { candidateEvaluationService, resetServiceMocks } from '../../test/servicesMock';
import { apiClient } from '../api';
import { ApiError } from '../api/ApiError';
import { formatDayAndTime } from '../utils/date';
import CandidateProfilePage from './CandidateProfilePage';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));
jest.mock('../api', () => ({
  apiClient: { getFile: jest.fn().mockRejectedValue(new Error('sem ficheiro')) },
}));

const { openProfile, getCv, accept, reject } = candidateEvaluationService;

function Probe() {
  const location = useLocation();
  return (
    <>
      <p data-testid="location">{`${location.pathname}${location.search}`}</p>
      <p data-testid="state">{JSON.stringify(location.state)}</p>
    </>
  );
}

function renderPage(entry: string | { pathname: string; state: unknown } = '/candidatos/match-1') {
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route
            path="/candidatos/:matchId"
            element={
              <>
                <CandidateProfilePage />
                <Probe />
              </>
            }
          />
          <Route path="*" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    </StrictMode>,
  );
}

const openMock = jest.fn();
const createUrl = jest.fn();
const revokeUrl = jest.fn();

beforeEach(() => {
  resetServiceMocks();
  jest.mocked(apiClient.getFile).mockRejectedValue(new Error('sem ficheiro'));
  openProfile.mockResolvedValue(candidateProfile());
  window.open = openMock;
  URL.createObjectURL = createUrl.mockReturnValue('blob:cv');
  URL.revokeObjectURL = revokeUrl;
});

afterEach(() => {
  jest.useRealTimers();
  openMock.mockReset();
  createUrl.mockClear();
  revokeUrl.mockClear();
});

async function loaded() {
  await screen.findByRole('heading', { name: /Ana Ferreira/ });
}

async function confirmDecision(action: 'Aceitar' | 'Recusar') {
  fireEvent.click(screen.getByRole('button', { name: action }));
  const confirm = within(screen.getByRole('dialog')).getByRole('button', { name: action });
  fireEvent.click(confirm);
  return confirm;
}

describe('CandidateProfilePage — perfil', () => {
  it('mostra os dados e a abertura registada, com um só pedido (StrictMode)', async () => {
    renderPage();
    await loaded();

    expect(screen.getByRole('heading', { name: /Programadora backend/ })).toBeInTheDocument();
    expect(screen.getByText('Guimarães (Braga)')).toBeInTheDocument();
    expect(screen.getByText('Um mês')).toBeInTheDocument();
    expect(screen.getByText('Três anos de experiência em APIs.')).toBeInTheDocument();
    expect(
      screen.getByText(`Abertura do perfil registada ${formatDayAndTime('2026-11-07T10:32:00Z')}.`),
    ).toBeInTheDocument();
    expect(openProfile).toHaveBeenCalledTimes(1);
    expect(openProfile).toHaveBeenCalledWith('match-1');
  });

  it('mostra «—» nos campos em falta e o marcador sem fotografia', async () => {
    openProfile.mockResolvedValue(
      candidateProfile({
        desiredRole: null,
        availability: null,
        experienceSummary: null,
        links: [],
        skills: [],
      }),
    );
    renderPage();
    await screen.findByRole('heading', { name: 'Ana Ferreira' });

    expect(screen.getAllByText('—')).toHaveLength(5);
    expect(screen.getByRole('img', { name: 'Fotografia de Ana Ferreira' })).toBeInTheDocument();
  });

  it('destaca as competências que coincidem com a vaga e explica o destaque', async () => {
    renderPage();
    await loaded();

    const matching = screen.getByText('C#').closest('li') as HTMLElement;
    const other = screen.getByText('SQL').closest('li');
    expect(matching).toHaveClass('skill-match');
    expect(within(matching).getByText(/coincide com a vaga/)).toBeInTheDocument();
    expect(other).not.toHaveClass('skill-match');
    expect(screen.getByText(/Competência que coincide com as pretendidas/)).toBeInTheDocument();
  });

  it('só http e https viram ligação; https abre com rel="noopener noreferrer"', async () => {
    openProfile.mockResolvedValue(
      candidateProfile({
        links: ['https://github.com/ana', 'javascript:alert(1)', 'ftp://x.pt', 'sem esquema'],
      }),
    );
    renderPage();
    await loaded();

    const link = screen.getByRole('link', { name: 'https://github.com/ana' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getAllByRole('link')).toHaveLength(2); // a ligação https e «Voltar aos candidatos»
    expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument();
    expect(screen.getByText('ftp://x.pt')).toBeInTheDocument();
  });

  it('mostra o carregamento enquanto o perfil não chega, sem ações de decisão', () => {
    openProfile.mockReturnValue(new Promise(() => undefined));
    renderPage();

    expect(screen.getByRole('status')).toHaveTextContent('A carregar');
    expect(screen.queryByRole('button', { name: 'Aceitar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Recusar' })).toBeNull();
    expect(getCv).not.toHaveBeenCalled();
  });
});

describe('CandidateProfilePage — CV', () => {
  it('sem CV mostra a frase e não há botão', async () => {
    renderPage();
    await loaded();

    expect(screen.getByText('Este candidato não tem CV.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Abrir CV (PDF)' })).toBeNull();
  });

  it('só pede o ficheiro ao clicar, abre-o num novo separador e revoga o endereço depois', async () => {
    openProfile.mockResolvedValue(candidateProfile({ hasCv: true }));
    getCv.mockResolvedValue(new Blob(['pdf']));
    renderPage();
    const button = await screen.findByRole('button', { name: 'Abrir CV (PDF)' });
    expect(getCv).not.toHaveBeenCalled();
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'nextTick'] });

    fireEvent.click(button);

    await waitFor(() => expect(openMock).toHaveBeenCalledWith('blob:cv', '_blank', 'noopener'));
    expect(getCv).toHaveBeenCalledWith('match-1');
    expect(revokeUrl).not.toHaveBeenCalled();
    act(() => jest.advanceTimersByTime(60_000));
    expect(revokeUrl).toHaveBeenCalledWith('blob:cv');
  });

  it('falha do CV mostra o alerta e mantém o perfil', async () => {
    openProfile.mockResolvedValue(candidateProfile({ hasCv: true }));
    getCv.mockRejectedValue(new ApiError(404, 'O candidato não tem CV.', 'ERR-20'));
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Abrir CV (PDF)' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('O candidato não tem CV.');
    expect(screen.getByRole('heading', { name: /Ana Ferreira/ })).toBeInTheDocument();
    expect(openMock).not.toHaveBeenCalled();
  });

  it('o botão desaparece depois de recusar', async () => {
    openProfile.mockResolvedValue(candidateProfile({ hasCv: true }));
    reject.mockResolvedValue(undefined);
    renderPage();
    await screen.findByRole('button', { name: 'Abrir CV (PDF)' });

    await confirmDecision('Recusar');

    await screen.findByText(/Candidato recusado/);
    expect(screen.queryByRole('button', { name: 'Abrir CV (PDF)' })).toBeNull();
  });
});

describe('CandidateProfilePage — decisão', () => {
  it('cada ação abre o diálogo com os efeitos e o aviso; cancelar não chama o serviço', async () => {
    renderPage();
    await loaded();

    fireEvent.click(screen.getByRole('button', { name: 'Aceitar' }));
    let dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('o match fica confirmado;')).toBeInTheDocument();
    expect(within(dialog).getByText('é criada a conversa.')).toBeInTheDocument();
    expect(within(dialog).getByText('Esta decisão não pode ser alterada.')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('o candidato não é avisado.')).toBeInTheDocument();
    expect(within(dialog).getByText('Esta decisão não pode ser alterada.')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(accept).not.toHaveBeenCalled();
    expect(reject).not.toHaveBeenCalled();
  });

  it('aceitar envia um só pedido (duplo clique) e navega para o match com o MatchDto', async () => {
    openProfile.mockResolvedValue(candidateProfile({ photoUrl: '/api/files/p.jpg' }));
    const confirmed = match();
    accept.mockResolvedValue(confirmed);
    renderPage();
    await loaded();

    const confirm = await confirmDecision('Aceitar');
    fireEvent.click(confirm);

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('/candidatos/match-1/match'),
    );
    expect(accept).toHaveBeenCalledTimes(1);
    expect(accept).toHaveBeenCalledWith('match-1');
    expect(JSON.parse(screen.getByTestId('state').textContent ?? '')).toEqual({
      match: confirmed,
      photoUrl: '/api/files/p.jpg',
    });
  });

  it('recusar envia um só pedido, mostra a decisão e já não há ações', async () => {
    reject.mockResolvedValue(undefined);
    renderPage();
    await loaded();

    const confirm = await confirmDecision('Recusar');
    fireEvent.click(confirm);

    expect(
      await screen.findByText('Candidato recusado. Não volta a ser sugerido para esta vaga.'),
    ).toBeInTheDocument();
    expect(reject).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Aceitar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Recusar' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Voltar aos candidatos' })).toBeInTheDocument();
  });

  it.each([
    ['ERR-35', 'A decisão sobre este interesse já foi registada.'],
    ['ERR-34', 'Abra o perfil do candidato antes de decidir.'],
  ])('409 %s mostra a mensagem, sem navegar nem dar a decisão como feita', async (code, text) => {
    accept.mockRejectedValue(new ApiError(409, text, code));
    renderPage();
    await loaded();

    await confirmDecision('Aceitar');

    expect(await screen.findByRole('alert')).toHaveTextContent(text);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent('/candidatos/match-1');
    expect(screen.queryByText(/Candidato recusado/)).toBeNull();
  });

  it('um 409 ao recusar também não mostra a recusa como feita', async () => {
    reject.mockRejectedValue(new ApiError(409, 'Já decidido.', 'ERR-35'));
    renderPage();
    await loaded();

    await confirmDecision('Recusar');

    expect(await screen.findByRole('alert')).toHaveTextContent('Já decidido.');
    expect(screen.queryByText(/Candidato recusado/)).toBeNull();
  });
});

describe('CandidateProfilePage — erros e navegação', () => {
  it.each([
    [403, 'ERR-08', 'Sem permissão.'],
    [404, 'ERR-20', 'Interesse não encontrado.'],
    [409, 'ERR-35', 'Decisão já registada.'],
  ])(
    'erro %i ao abrir o perfil mostra a mensagem e a ligação para voltar',
    async (status, code, text) => {
      openProfile.mockRejectedValue(new ApiError(status, text, code));
      renderPage();

      expect(await screen.findByRole('alert')).toHaveTextContent(text);
      expect(screen.getByRole('link', { name: 'Voltar aos candidatos' })).toHaveAttribute(
        'href',
        '/candidatos',
      );
      expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
      expect(screen.queryByRole('button', { name: 'Aceitar' })).toBeNull();
    },
  );

  it('falha de ligação mostra o alerta e «Tentar de novo» repete o pedido', async () => {
    openProfile.mockRejectedValueOnce(ApiError.connectionFailure());
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      ApiError.connectionFailure().message,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    await loaded();
    expect(openProfile).toHaveBeenCalledTimes(2);
  });

  it('«Voltar aos candidatos» usa ?vaga= quando há state.jobId', async () => {
    renderPage({ pathname: '/candidatos/match-1', state: { jobId: 'job 1' } });
    await loaded();

    expect(screen.getByRole('link', { name: 'Voltar aos candidatos' })).toHaveAttribute(
      'href',
      '/candidatos?vaga=job%201',
    );
  });
});
