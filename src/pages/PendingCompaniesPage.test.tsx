import { fireEvent, screen, within } from '@testing-library/react';
import { pendingCompany } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import { adminCompanyService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const location = () => screen.getByTestId('location').textContent;
const open = () => renderApp('/admin/pendentes', signedInStore('ADMIN'));

beforeEach(() => resetServiceMocks());

describe('PendingCompaniesPage (A03)', () => {
  it('lista as Empresas pendentes pela ordem da API, com designação, NIF e data de submissão', async () => {
    adminCompanyService.listPending.mockResolvedValue([
      pendingCompany(),
      pendingCompany({
        companyId: 'company-2',
        companyName: 'Padaria Sol, Lda.',
        taxId: '500111222',
        submittedAt: '2026-10-12T09:30:00Z',
      }),
    ]);
    open();

    const rows = await screen.findAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(within(rows[1]).getByText('Lumen Software, Lda.')).toBeInTheDocument();
    expect(within(rows[1]).getByText('509123456')).toBeInTheDocument();
    expect(within(rows[1]).getByText('05/10/2026')).toBeInTheDocument();
    expect(within(rows[2]).getByText('Padaria Sol, Lda.')).toBeInTheDocument();
    expect(within(rows[2]).getByText('12/10/2026')).toBeInTheDocument();
  });

  it('mostra o estado de carregamento enquanto espera pela lista', () => {
    adminCompanyService.listPending.mockReturnValue(new Promise(() => undefined));
    open();

    expect(screen.getByText('A carregar as Empresas pendentes…')).toBeInTheDocument();
  });

  it('«Abrir registo» leva ao detalhe da Empresa', async () => {
    adminCompanyService.listPending.mockResolvedValue([pendingCompany()]);
    adminCompanyService.getSubmittedData.mockReturnValue(new Promise(() => undefined));
    open();

    fireEvent.click(await screen.findByRole('button', { name: 'Abrir registo' }));

    expect(location()).toBe('/admin/pendentes/company-1');
  });

  it('sem pendentes (A03d), diz que não há Empresas e dá acesso a todas as Empresas', async () => {
    open();

    expect(await screen.findByText('Não há Empresas a aguardar aprovação.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver todas as Empresas' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Empresas' })).toBeInTheDocument();
    expect(location()).toBe('/admin/empresas');
  });

  it('falha de ligação: mostra o aviso e «Tentar de novo» repete o pedido', async () => {
    adminCompanyService.listPending.mockRejectedValueOnce(ApiError.connectionFailure());
    adminCompanyService.listPending.mockResolvedValue([pendingCompany()]);
    open();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível contactar o servidor',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Lumen Software, Lda.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('o erro do servidor (403 ERR-06) é mostrado com a mensagem recebida', async () => {
    adminCompanyService.listPending.mockRejectedValue(
      new ApiError(403, 'A operação não está disponível para este tipo de conta.', 'ERR-06'),
    );
    open();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A operação não está disponível para este tipo de conta.',
    );
  });
});
