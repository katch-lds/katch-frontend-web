import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { pendingCompany } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import { adminCompanyService, authService, resetServiceMocks } from '../../test/servicesMock';
import { ApiError } from '../api/ApiError';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

beforeEach(() => resetServiceMocks());

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Administrador Katch' }));

describe('AdminShell e UserMenu', () => {
  it('mostra a barra lateral por secções, sem conversas nem notificações, e o menu fechado', () => {
    renderApp('/admin/indicadores', signedInStore('ADMIN'));

    const nav = screen.getByRole('navigation', { name: 'Navegação da supervisão' });
    const links = within(nav)
      .getAllByRole('link')
      .map((link) => [link.textContent, link.getAttribute('href')]);
    expect(links).toEqual([
      ['Indicadores', '/admin/indicadores'],
      ['Pendentes de aprovação', '/admin/pendentes'],
      ['Todas as Empresas', '/admin/empresas'],
      ['Vagas publicadas', '/admin/vagas'],
      ['Contas de utilizador', '/admin/contas'],
      ['Candidatos', '/admin/candidatos'],
      ['Listas pré-definidas', '/admin/listas'],
    ]);
    ['Empresas', 'Utilizadores', 'Configuração'].forEach((section) =>
      expect(within(nav).getByText(section)).toBeInTheDocument(),
    );
    expect(within(nav).queryByText(/conversas|notificações/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Administrador Katch' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('o contador de «Pendentes de aprovação» mostra o número de Empresas pendentes (RF091)', async () => {
    adminCompanyService.listPending.mockResolvedValue([
      pendingCompany(),
      pendingCompany({ companyId: 'company-2', companyName: 'Padaria Sol, Lda.' }),
    ]);
    renderApp('/admin/indicadores', signedInStore('ADMIN'));

    const badge = await screen.findByLabelText('2 Empresas pendentes');

    expect(badge).toHaveTextContent('2');
    expect(badge.closest('a')).toHaveAttribute('href', '/admin/pendentes');
  });

  it('sem Empresas pendentes, ou se a leitura falhar, não há contador', async () => {
    adminCompanyService.listPending.mockRejectedValue(ApiError.connectionFailure());
    renderApp('/admin/indicadores', signedInStore('ADMIN'));

    await waitFor(() => expect(adminCompanyService.listPending).toHaveBeenCalled());

    expect(screen.queryByLabelText(/Empresas? pendentes?/)).not.toBeInTheDocument();
  });

  it('abre o menu com o correio da sessão e fecha ao clicar de novo', () => {
    renderApp('/admin/indicadores', signedInStore('ADMIN'));

    openMenu();

    expect(screen.getByRole('menu')).toHaveTextContent('utilizador@exemplo.pt');
    expect(screen.getByRole('menuitem', { name: 'Alterar palavra-passe' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Terminar sessão' })).toBeInTheDocument();
    openMenu();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('fecha o menu ao clicar fora e com Escape, mas não ao clicar dentro', () => {
    renderApp('/admin/indicadores', signedInStore('ADMIN'));

    openMenu();
    fireEvent.mouseDown(screen.getByRole('menu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    openMenu();
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('«Alterar palavra-passe» leva a /admin/conta, dentro da moldura', async () => {
    renderApp('/admin/indicadores', signedInStore('ADMIN'));

    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Alterar palavra-passe' }));

    expect(await screen.findByLabelText('Palavra-passe atual')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/conta');
    expect(screen.getByRole('button', { name: 'Administrador Katch' })).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('«Terminar sessão» limpa a sessão e volta a /admin/entrar (RF107)', async () => {
    const store = renderApp('/admin/indicadores', signedInStore('ADMIN'));

    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Terminar sessão' }));

    expect(await screen.findByText('Os Candidatos utilizam a aplicação móvel')).toBeInTheDocument();
    expect(store.get()).toBeNull();
    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('location')).toHaveTextContent('/admin/entrar');
  });

  it('depois do fim de sessão, abrir /admin/indicadores pede novo início de sessão', () => {
    renderApp('/admin/indicadores');

    expect(screen.getByTestId('location')).toHaveTextContent('/admin/entrar');
    expect(screen.queryByRole('heading', { name: 'Indicadores' })).not.toBeInTheDocument();
  });

  it('o fim de sessão fica efetivo mesmo que o pedido de logout falhe', async () => {
    authService.logout.mockRejectedValue(ApiError.connectionFailure());
    const store = renderApp('/admin/indicadores', signedInStore('ADMIN'));

    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Terminar sessão' }));

    expect(await screen.findByText('Os Candidatos utilizam a aplicação móvel')).toBeInTheDocument();
    expect(store.get()).toBeNull();
  });
});
