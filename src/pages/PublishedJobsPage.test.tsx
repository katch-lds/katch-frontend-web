import { fireEvent, screen, within } from '@testing-library/react';
import { publishedJob } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import { adminCompanyService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

const open = () => renderApp('/admin/vagas', signedInStore('ADMIN'));

beforeEach(() => resetServiceMocks());

describe('PublishedJobsPage (A06)', () => {
  it('lista função, Empresa, data de publicação e interesses, sem ações', async () => {
    adminCompanyService.listPublishedJobs.mockResolvedValue([
      publishedJob(1, { interestCount: 3 }),
    ]);
    open();

    const row = within((await screen.findByText('Programador Backend .NET 1')).closest('tr')!);
    expect(row.getByText('Lumen Software, Lda.')).toBeInTheDocument();
    expect(row.getByText('09/10/2026')).toBeInTheDocument();
    expect(row.getByText('3')).toBeInTheDocument();
    expect(row.queryByRole('button')).not.toBeInTheDocument();
  });

  it('pagina no cliente com 12 linhas por página', async () => {
    adminCompanyService.listPublishedJobs.mockResolvedValue(
      Array.from({ length: 13 }, (_, index) => publishedJob(index + 1)),
    );
    open();

    await screen.findByText('Programador Backend .NET 1');
    expect(screen.getAllByRole('row')).toHaveLength(13);
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }));

    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('Programador Backend .NET 13')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Seguinte' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));

    expect(screen.getByText('Programador Backend .NET 1')).toBeInTheDocument();
  });

  it('com 12 vagas não há paginação', async () => {
    adminCompanyService.listPublishedJobs.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) => publishedJob(index + 1)),
    );
    open();

    await screen.findByText('Programador Backend .NET 12');

    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument();
  });

  it('sem vagas publicadas mostra a mensagem de lista vazia', async () => {
    open();

    expect(await screen.findByText('Não há vagas publicadas.')).toBeInTheDocument();
  });

  it('falha de ligação: aviso e «Tentar de novo»', async () => {
    adminCompanyService.listPublishedJobs.mockRejectedValueOnce(ApiError.connectionFailure());
    adminCompanyService.listPublishedJobs.mockResolvedValue([publishedJob(1)]);
    open();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível contactar o servidor',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Programador Backend .NET 1')).toBeInTheDocument();
  });

  it('mostra o estado de carregamento', () => {
    adminCompanyService.listPublishedJobs.mockReturnValue(new Promise(() => undefined));
    open();

    expect(screen.getByText('A carregar as vagas publicadas…')).toBeInTheDocument();
  });
});
