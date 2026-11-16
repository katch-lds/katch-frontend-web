import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { account } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import { adminAccountService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const { listAccounts, block, reactivate } = adminAccountService;

const active = account();
const recruiter = account({
  userId: 'user-2',
  email: 'recrutamento@lumen-exemplo.pt',
  userType: 'RECRUITER',
});
const blocked = account({ userId: 'user-3', email: 'rui.matos@exemplo.pt', status: 'BLOCKED' });
const suspended = account({
  userId: 'user-4',
  email: 'marta.lopes@exemplo.pt',
  status: 'SUSPENDED',
});
const admin = account({ userId: 'user-5', email: 'admin@katch.pt', userType: 'ADMIN' });

async function openPage(accounts = [active, recruiter, blocked, suspended, admin]) {
  listAccounts.mockResolvedValue(accounts);
  renderApp('/admin/contas', signedInStore('ADMIN'));
  await screen.findByText(accounts[0].email);
}

const rowOf = (email: string) => within(screen.getByText(email).closest('tr') as HTMLElement);
const actionsOf = (email: string) =>
  rowOf(email)
    .queryAllByRole('button')
    .map((button) => button.textContent);

beforeEach(() => resetServiceMocks());

describe('AccountsPage (A07)', () => {
  it('lista correio eletrónico, tipo e estado', async () => {
    await openPage();

    expect(screen.getAllByRole('row')).toHaveLength(6);
    expect(rowOf('ana.ferreira@exemplo.pt').getByText('Candidato')).toBeInTheDocument();
    expect(rowOf('ana.ferreira@exemplo.pt').getByText('Ativa')).toBeInTheDocument();
    expect(rowOf('recrutamento@lumen-exemplo.pt').getByText('Recrutador')).toBeInTheDocument();
    expect(rowOf('rui.matos@exemplo.pt').getByText('Bloqueada')).toBeInTheDocument();
    expect(rowOf('marta.lopes@exemplo.pt').getByText('Suspensa')).toBeInTheDocument();
    expect(rowOf('admin@katch.pt').getByText('Administrador')).toBeInTheDocument();
  });

  it('cada ação só aparece no estado e no tipo em que a API a admite', async () => {
    await openPage();

    expect(actionsOf('ana.ferreira@exemplo.pt')).toEqual(['Bloquear']);
    expect(actionsOf('recrutamento@lumen-exemplo.pt')).toEqual(['Bloquear']);
    expect(actionsOf('rui.matos@exemplo.pt')).toEqual(['Reativar']);
    // A conta suspensa reativa-se em Candidatos, e a de Administrador não tem ações.
    expect(actionsOf('marta.lopes@exemplo.pt')).toEqual([]);
    expect(
      rowOf('marta.lopes@exemplo.pt').getByRole('link', { name: 'Reativar em Candidatos' }),
    ).toHaveAttribute('href', '/admin/candidatos');
    expect(actionsOf('admin@katch.pt')).toEqual([]);
    expect(rowOf('admin@katch.pt').queryByRole('link')).not.toBeInTheDocument();
  });

  it('pesquisa por correio eletrónico', async () => {
    await openPage();

    fireEvent.change(screen.getByLabelText('Pesquisar por correio eletrónico'), {
      target: { value: 'LUMEN' },
    });

    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('recrutamento@lumen-exemplo.pt')).toBeInTheDocument();
  });

  it('filtra por tipo e por estado', async () => {
    await openPage();

    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'CANDIDATE' } });
    expect(screen.getAllByRole('row')).toHaveLength(4);

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'BLOCKED' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('rui.matos@exemplo.pt')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: '' } });
    expect(screen.getAllByRole('row')).toHaveLength(6);
  });

  it('sem resultados mostra a mensagem de lista vazia', async () => {
    await openPage();

    fireEvent.change(screen.getByLabelText('Pesquisar por correio eletrónico'), {
      target: { value: 'ninguem' },
    });

    expect(screen.getByText('Não há contas que correspondam à pesquisa.')).toBeInTheDocument();
  });

  it('pagina com 12 linhas por página', async () => {
    await openPage(
      Array.from({ length: 25 }, (_, index) =>
        account({
          userId: `user-${index}`,
          email: `pessoa${String(index).padStart(2, '0')}@exemplo.pt`,
        }),
      ),
    );

    expect(screen.getAllByRole('row')).toHaveLength(13);
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }));
    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }));

    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('pessoa24@exemplo.pt')).toBeInTheDocument();
  });

  it('«Bloquear» pede confirmação (A07b), bloqueia, mostra a mensagem e lê a lista de novo', async () => {
    block.mockResolvedValue(undefined);
    await openPage();

    fireEvent.click(rowOf('ana.ferreira@exemplo.pt').getByRole('button', { name: 'Bloquear' }));
    const dialog = await screen.findByRole('dialog', { name: 'Bloquear conta' });
    expect(block).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Bloquear' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Conta ana.ferreira@exemplo.pt bloqueada.',
    );
    expect(block).toHaveBeenCalledWith('user-1');
    await waitFor(() => expect(listAccounts).toHaveBeenCalledTimes(2));
  });

  it('cancelar a confirmação não faz nenhum pedido', async () => {
    await openPage();

    fireEvent.click(rowOf('ana.ferreira@exemplo.pt').getByRole('button', { name: 'Bloquear' }));
    const dialog = await screen.findByRole('dialog', { name: 'Bloquear conta' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(block).not.toHaveBeenCalled();
  });

  it('«Reativar» uma conta bloqueada pede confirmação (A07c), reativa e lê a lista de novo (A07d)', async () => {
    reactivate.mockResolvedValue(undefined);
    await openPage();

    fireEvent.click(rowOf('rui.matos@exemplo.pt').getByRole('button', { name: 'Reativar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reativar conta' });
    expect(reactivate).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reativar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Conta rui.matos@exemplo.pt reativada.',
    );
    expect(reactivate).toHaveBeenCalledWith('user-3');
    await waitFor(() => expect(listAccounts).toHaveBeenCalledTimes(2));
  });

  it('uma conta que já mudou de estado (409 ERR-30) mostra a mensagem do servidor', async () => {
    block.mockRejectedValue(
      new ApiError(409, 'A operação não é permitida no estado atual: bloqueada.', 'ERR-30'),
    );
    await openPage();

    fireEvent.click(rowOf('ana.ferreira@exemplo.pt').getByRole('button', { name: 'Bloquear' }));
    const dialog = await screen.findByRole('dialog', { name: 'Bloquear conta' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Bloquear' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('não é permitida no estado atual');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await waitFor(() => expect(listAccounts).toHaveBeenCalledTimes(2));
  });

  it('uma conta que já não existe (404 ERR-20) mostra a mensagem do servidor', async () => {
    reactivate.mockRejectedValue(
      new ApiError(404, 'O elemento pedido não existe ou não está disponível.', 'ERR-20'),
    );
    await openPage();

    fireEvent.click(rowOf('rui.matos@exemplo.pt').getByRole('button', { name: 'Reativar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reativar conta' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reativar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('não existe');
  });

  it('falha de ligação ao abrir: aviso e «Tentar de novo»', async () => {
    listAccounts.mockRejectedValueOnce(ApiError.connectionFailure());
    listAccounts.mockResolvedValue([active]);
    renderApp('/admin/contas', signedInStore('ADMIN'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível contactar o servidor',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('ana.ferreira@exemplo.pt')).toBeInTheDocument();
  });

  it('mostra o estado de carregamento', () => {
    listAccounts.mockReturnValue(new Promise(() => undefined));
    renderApp('/admin/contas', signedInStore('ADMIN'));

    expect(screen.getByText('A carregar as contas…')).toBeInTheDocument();
  });
});
