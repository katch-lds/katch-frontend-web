import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { candidateAdmin } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import { adminAccountService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const { listCandidates, suspendCandidate, reactivate } = adminAccountService;

const ana = candidateAdmin();
const rui = candidateAdmin({
  candidateId: 'candidate-2',
  fullName: 'Rui Matos',
  email: 'rui.matos@exemplo.pt',
  locationName: 'Braga (Braga)',
  registeredAt: '2026-10-12T08:00:00Z',
  status: 'SUSPENDED',
});
const marta = candidateAdmin({
  candidateId: 'candidate-3',
  fullName: 'Marta Lopes',
  email: 'marta.lopes@exemplo.pt',
  status: 'BLOCKED',
});

async function openPage() {
  listCandidates.mockResolvedValue([ana, rui, marta]);
  renderApp('/admin/candidatos', signedInStore('ADMIN'));
  await screen.findByText('Ana Ferreira');
}

const rowOf = (name: string) => within(screen.getByText(name).closest('tr') as HTMLElement);
const actionsOf = (name: string) =>
  rowOf(name)
    .queryAllByRole('button')
    .map((button) => button.textContent);

beforeEach(() => resetServiceMocks());

describe('CandidatesPage (A08)', () => {
  it('lista nome, correio, localidade, data de registo e estado, com «n Candidatos · m ativos»', async () => {
    await openPage();

    expect(screen.getByText('3 Candidatos · 1 ativo')).toBeInTheDocument();
    const row = rowOf('Ana Ferreira');
    expect(row.getByText('ana.ferreira@exemplo.pt')).toBeInTheDocument();
    expect(row.getByText('Guimarães (Braga)')).toBeInTheDocument();
    expect(row.getByText('09/10/2026')).toBeInTheDocument();
    expect(row.getByText('Ativa')).toBeInTheDocument();
    expect(rowOf('Rui Matos').getByText('Suspensa')).toBeInTheDocument();
    expect(rowOf('Marta Lopes').getByText('Bloqueada')).toBeInTheDocument();
  });

  it('o resumo usa o singular com um só Candidato', async () => {
    listCandidates.mockResolvedValue([ana]);
    renderApp('/admin/candidatos', signedInStore('ADMIN'));

    expect(await screen.findByText('1 Candidato · 1 ativo')).toBeInTheDocument();
  });

  it('cada ação só aparece no estado em que a API a admite', async () => {
    await openPage();

    expect(actionsOf('Ana Ferreira')).toEqual(['Suspender']);
    expect(actionsOf('Rui Matos')).toEqual(['Reativar']);
    // A conta bloqueada reativa-se em Contas de utilizador.
    expect(actionsOf('Marta Lopes')).toEqual([]);
    expect(rowOf('Marta Lopes').getByRole('link', { name: 'Reativar em Contas' })).toHaveAttribute(
      'href',
      '/admin/contas',
    );
  });

  it('«Suspender» pede confirmação (A08b), suspende, mostra a mensagem e lê a lista de novo', async () => {
    suspendCandidate.mockResolvedValue(undefined);
    await openPage();

    fireEvent.click(rowOf('Ana Ferreira').getByRole('button', { name: 'Suspender' }));
    const dialog = await screen.findByRole('dialog', { name: 'Suspender conta de Candidato' });
    expect(suspendCandidate).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Suspender' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Conta de Ana Ferreira suspensa.');
    expect(suspendCandidate).toHaveBeenCalledWith('candidate-1');
    await waitFor(() => expect(listCandidates).toHaveBeenCalledTimes(2));
  });

  it('cancelar a confirmação não faz nenhum pedido', async () => {
    await openPage();

    fireEvent.click(rowOf('Ana Ferreira').getByRole('button', { name: 'Suspender' }));
    const dialog = await screen.findByRole('dialog', { name: 'Suspender conta de Candidato' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(suspendCandidate).not.toHaveBeenCalled();
  });

  it('«Reativar» usa o candidateId (o identificador da conta), pede confirmação e lê a lista de novo', async () => {
    reactivate.mockResolvedValue(undefined);
    await openPage();

    fireEvent.click(rowOf('Rui Matos').getByRole('button', { name: 'Reativar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reativar conta de Candidato' });
    expect(reactivate).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reativar' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Conta de Rui Matos reativada.');
    expect(reactivate).toHaveBeenCalledWith('candidate-2');
    await waitFor(() => expect(listCandidates).toHaveBeenCalledTimes(2));
  });

  it('um Candidato que já mudou de estado (409 ERR-30) mostra a mensagem do servidor', async () => {
    suspendCandidate.mockRejectedValue(
      new ApiError(409, 'A operação não é permitida no estado atual: suspensa.', 'ERR-30'),
    );
    await openPage();

    fireEvent.click(rowOf('Ana Ferreira').getByRole('button', { name: 'Suspender' }));
    const dialog = await screen.findByRole('dialog', { name: 'Suspender conta de Candidato' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Suspender' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('não é permitida no estado atual');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await waitFor(() => expect(listCandidates).toHaveBeenCalledTimes(2));
  });

  it('sem Candidatos mostra a mensagem de lista vazia', async () => {
    renderApp('/admin/candidatos', signedInStore('ADMIN'));

    expect(await screen.findByText('Ainda não há Candidatos registados.')).toBeInTheDocument();
    expect(screen.getByText('0 Candidatos · 0 ativos')).toBeInTheDocument();
  });

  it('falha de ligação ao abrir: aviso e «Tentar de novo»', async () => {
    listCandidates.mockRejectedValueOnce(ApiError.connectionFailure());
    listCandidates.mockResolvedValue([ana]);
    renderApp('/admin/candidatos', signedInStore('ADMIN'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível contactar o servidor',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Ana Ferreira')).toBeInTheDocument();
  });

  it('mostra o estado de carregamento', () => {
    listCandidates.mockReturnValue(new Promise(() => undefined));
    renderApp('/admin/candidatos', signedInStore('ADMIN'));

    expect(screen.getByText('A carregar os Candidatos…')).toBeInTheDocument();
  });
});
