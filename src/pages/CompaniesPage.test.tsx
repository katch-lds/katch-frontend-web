import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { companyAdmin } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import { adminCompanyService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const { listCompanies, suspend, reactivate } = adminCompanyService;

const approved = companyAdmin();
const pending = companyAdmin({
  companyId: 'company-2',
  companyName: 'Padaria Sol, Lda.',
  status: 'PENDING',
  publishedJobs: 0,
});
const rejected = companyAdmin({
  companyId: 'company-3',
  companyName: 'Oficina Norte, Lda.',
  status: 'REJECTED',
  publishedJobs: 0,
});
const suspended = companyAdmin({
  companyId: 'company-4',
  companyName: 'Café Central, Lda.',
  status: 'SUSPENDED',
  publishedJobs: 2,
});

const location = () => screen.getByTestId('location').textContent;

async function openPage() {
  listCompanies.mockResolvedValue([approved, pending, rejected, suspended]);
  renderApp('/admin/empresas', signedInStore('ADMIN'));
  await screen.findByText('Lumen Software, Lda.');
}

const rowOf = (name: string) => within(screen.getByText(name).closest('tr') as HTMLElement);

beforeEach(() => resetServiceMocks());

describe('CompaniesPage (A05)', () => {
  it('lista designação social, estado e vagas publicadas de todas as Empresas', async () => {
    await openPage();

    expect(screen.getAllByRole('row')).toHaveLength(5);
    expect(rowOf('Lumen Software, Lda.').getByText('Aprovada')).toBeInTheDocument();
    expect(rowOf('Lumen Software, Lda.').getByText('4')).toBeInTheDocument();
    expect(rowOf('Padaria Sol, Lda.').getByText('Pendente')).toBeInTheDocument();
    expect(rowOf('Oficina Norte, Lda.').getByText('Recusada')).toBeInTheDocument();
    expect(rowOf('Café Central, Lda.').getByText('Suspensa')).toBeInTheDocument();
  });

  it('cada ação só aparece no estado em que a API a admite', async () => {
    await openPage();

    const actionsOf = (name: string) =>
      rowOf(name)
        .queryAllByRole('button')
        .map((button) => button.textContent);
    expect(actionsOf('Lumen Software, Lda.')).toEqual(['Suspender']);
    expect(actionsOf('Padaria Sol, Lda.')).toEqual(['Decidir']);
    expect(actionsOf('Oficina Norte, Lda.')).toEqual([]);
    expect(actionsOf('Café Central, Lda.')).toEqual(['Reativar']);
  });

  it('filtra por estado e mostra todas ao repor o filtro', async () => {
    await openPage();
    const filter = screen.getByLabelText('Estado');

    fireEvent.change(filter, { target: { value: 'SUSPENDED' } });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('Café Central, Lda.')).toBeInTheDocument();
    expect(screen.queryByText('Lumen Software, Lda.')).not.toBeInTheDocument();

    fireEvent.change(filter, { target: { value: '' } });
    expect(screen.getAllByRole('row')).toHaveLength(5);
  });

  it('um filtro sem resultados mostra a mensagem de lista vazia', async () => {
    listCompanies.mockResolvedValue([approved]);
    renderApp('/admin/empresas', signedInStore('ADMIN'));
    await screen.findByText('Lumen Software, Lda.');

    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'REJECTED' } });

    expect(screen.getByText('Não há Empresas com o estado escolhido.')).toBeInTheDocument();
  });

  it('«Decidir» leva ao detalhe da Empresa pendente', async () => {
    adminCompanyService.getSubmittedData.mockReturnValue(new Promise(() => undefined));
    await openPage();

    fireEvent.click(rowOf('Padaria Sol, Lda.').getByRole('button', { name: 'Decidir' }));

    expect(location()).toBe('/admin/pendentes/company-2');
  });

  it('«Suspender» pede confirmação (A05b), suspende, mostra a mensagem e lê a lista de novo', async () => {
    suspend.mockResolvedValue(undefined);
    await openPage();
    listCompanies.mockResolvedValue([
      { ...approved, status: 'SUSPENDED' },
      pending,
      rejected,
      suspended,
    ]);

    fireEvent.click(rowOf('Lumen Software, Lda.').getByRole('button', { name: 'Suspender' }));
    const dialog = await screen.findByRole('dialog', { name: 'Suspender Empresa' });
    expect(suspend).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Suspender' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Empresa «Lumen Software, Lda.» suspensa.',
    );
    expect(suspend).toHaveBeenCalledWith('company-1');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(listCompanies).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(
        rowOf('Lumen Software, Lda.').getByRole('button', { name: 'Reativar' }),
      ).toBeInTheDocument(),
    );
  });

  it('cancelar a confirmação não faz nenhum pedido', async () => {
    await openPage();

    fireEvent.click(rowOf('Lumen Software, Lda.').getByRole('button', { name: 'Suspender' }));
    const dialog = await screen.findByRole('dialog', { name: 'Suspender Empresa' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(suspend).not.toHaveBeenCalled();
  });

  it('«Reativar» pede confirmação, reativa, mostra a mensagem e lê a lista de novo', async () => {
    reactivate.mockResolvedValue(undefined);
    await openPage();

    fireEvent.click(rowOf('Café Central, Lda.').getByRole('button', { name: 'Reativar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reativar Empresa' });
    expect(reactivate).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reativar' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Empresa «Café Central, Lda.» reativada.',
    );
    expect(reactivate).toHaveBeenCalledWith('company-4');
    await waitFor(() => expect(listCompanies).toHaveBeenCalledTimes(2));
  });

  it('repetir a suspensão (409 ERR-30) mostra a mensagem do servidor e lê a lista de novo', async () => {
    suspend.mockRejectedValue(
      new ApiError(409, 'A operação não é permitida no estado atual: suspensa.', 'ERR-30'),
    );
    await openPage();

    fireEvent.click(rowOf('Lumen Software, Lda.').getByRole('button', { name: 'Suspender' }));
    const dialog = await screen.findByRole('dialog', { name: 'Suspender Empresa' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Suspender' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('não é permitida no estado atual');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(listCompanies).toHaveBeenCalledTimes(2));
  });

  it('falha de ligação ao abrir: aviso e «Tentar de novo»', async () => {
    listCompanies.mockRejectedValueOnce(ApiError.connectionFailure());
    listCompanies.mockResolvedValue([approved]);
    renderApp('/admin/empresas', signedInStore('ADMIN'));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível contactar o servidor',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Lumen Software, Lda.')).toBeInTheDocument();
  });

  it('mostra o estado de carregamento', () => {
    listCompanies.mockReturnValue(new Promise(() => undefined));
    renderApp('/admin/empresas', signedInStore('ADMIN'));

    expect(screen.getByText('A carregar as Empresas…')).toBeInTheDocument();
  });
});
