import { fireEvent, screen, within } from '@testing-library/react';
import { companyStatus, conversation } from '../../test/fixtures';
import { renderApp, signedInStore } from '../../test/renderApp';
import {
  authService,
  companyService,
  conversationService,
  resetServiceMocks,
} from '../../test/servicesMock';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

beforeEach(() => {
  resetServiceMocks();
  companyService.getStatus.mockResolvedValue(companyStatus({ status: 'APPROVED' }));
});

describe('RecruiterShell', () => {
  it('mostra a barra lateral com Vagas, Candidatos, Matches, Conversas e «Terminar sessão»', async () => {
    renderApp('/matches', signedInStore('RECRUITER'));

    const nav = await screen.findByRole('navigation', { name: 'Navegação do Recrutador' });

    expect(within(nav).getByRole('link', { name: 'Vagas' })).toHaveAttribute('href', '/vagas');
    expect(within(nav).getByRole('link', { name: 'Candidatos' })).toHaveAttribute(
      'href',
      '/candidatos',
    );
    expect(within(nav).getByRole('link', { name: 'Matches' })).toHaveAttribute('href', '/matches');
    expect(within(nav).getByRole('link', { name: /^Conversas/ })).toHaveAttribute(
      'href',
      '/conversas',
    );
    expect(within(nav).getByRole('button', { name: 'Terminar sessão' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Matches da Empresa' })).toBeInTheDocument();
  });

  it('soma as mensagens por ler de todas as conversas no contador de «Conversas»', async () => {
    conversationService.list.mockResolvedValue([
      conversation({ matchId: 'm1', unreadCount: 2 }),
      conversation({ matchId: 'm2', unreadCount: 3 }),
      conversation({ matchId: 'm3', unreadCount: 0 }),
    ]);

    renderApp('/matches', signedInStore('RECRUITER'));

    expect(await screen.findByLabelText('5 mensagens por ler')).toHaveTextContent('5');
  });

  it('sem mensagens por ler não mostra o contador', async () => {
    conversationService.list.mockResolvedValue([conversation({ unreadCount: 0 })]);

    renderApp('/matches', signedInStore('RECRUITER'));

    await screen.findByRole('navigation', { name: 'Navegação do Recrutador' });
    await screen.findByText('Matches da Empresa');
    expect(screen.queryByLabelText(/mensagens por ler/)).not.toBeInTheDocument();
  });

  it('monta o ConversationsProvider com o userId da sessão (a lista é lida ao montar)', async () => {
    const store = signedInStore('RECRUITER');

    renderApp('/matches', store);

    await screen.findByRole('navigation', { name: 'Navegação do Recrutador' });
    expect(conversationService.list).toHaveBeenCalledTimes(1);
  });

  it('«Terminar sessão» termina a sessão e leva ao início de sessão do Recrutador', async () => {
    const store = renderApp('/matches', signedInStore('RECRUITER'));
    const nav = await screen.findByRole('navigation', { name: 'Navegação do Recrutador' });

    fireEvent.click(within(nav).getByRole('button', { name: 'Terminar sessão' }));

    await screen.findByRole('heading', { name: 'Início de sessão' });
    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(store.get()).toBeNull();
    expect(screen.getByTestId('location')).toHaveTextContent('/entrar');
  });
});

describe('RecruiterShell — variante bloqueada (P1 e P2)', () => {
  const nav = () => screen.getByRole('navigation', { name: 'Navegação do Recrutador' });
  const isLink = (name: string) => within(nav()).queryByRole('link', { name }) !== null;

  it.each([
    [
      'PENDING',
      { vagas: false, candidatos: false, estado: true, matches: false, conversas: false },
    ],
    [
      'REJECTED',
      { vagas: false, candidatos: false, estado: true, matches: false, conversas: false },
    ],
    [
      'SUSPENDED',
      { vagas: false, candidatos: false, estado: true, matches: false, conversas: true },
    ],
    ['APPROVED', { vagas: true, candidatos: true, estado: false, matches: true, conversas: true }],
  ] as const)('Empresa %s: itens disponíveis e bloqueados', async (status, expected) => {
    companyService.getStatus.mockResolvedValue(companyStatus({ status }));
    renderApp('/conta', signedInStore('RECRUITER'));
    await screen.findByRole('heading', { name: 'Conta' });

    expect(isLink('Vagas')).toBe(expected.vagas);
    expect(isLink('Candidatos')).toBe(expected.candidatos);
    expect(isLink('Estado do pedido')).toBe(expected.estado);
    expect(isLink('Matches')).toBe(expected.matches);
    expect(isLink('Conversas')).toBe(expected.conversas);
    expect(isLink('Conta')).toBe(true);
    expect(within(nav()).getByRole('button', { name: 'Terminar sessão' })).toBeInTheDocument();
  });

  it('os itens bloqueados aparecem, mas desativados', async () => {
    companyService.getStatus.mockResolvedValue(companyStatus({ status: 'PENDING' }));
    renderApp('/conta', signedInStore('RECRUITER'));
    await screen.findByRole('heading', { name: 'Conta' });

    expect(within(nav()).getByText('Matches')).toHaveAttribute('aria-disabled', 'true');
    expect(within(nav()).getByText('Conversas')).toHaveAttribute('aria-disabled', 'true');
  });

  it('sem Empresa registada, a barra leva ao registo e Conta continua acessível', async () => {
    companyService.getStatus.mockResolvedValue(null);
    renderApp('/conta', signedInStore('RECRUITER'));
    await screen.findByRole('heading', { name: 'Conta' });

    expect(within(nav()).getByRole('link', { name: 'Registo da Empresa' })).toHaveAttribute(
      'href',
      '/empresa/registo',
    );
    expect(isLink('Conta')).toBe(true);
    expect(isLink('Matches')).toBe(false);
    expect(isLink('Candidatos')).toBe(false);
    expect(isLink('Conversas')).toBe(false);
  });

  it('só monta as conversas com a Empresa aprovada ou suspensa', async () => {
    companyService.getStatus.mockResolvedValue(companyStatus({ status: 'REJECTED' }));
    renderApp('/conta', signedInStore('RECRUITER'));
    await screen.findByRole('heading', { name: 'Conta' });

    expect(conversationService.list).not.toHaveBeenCalled();
  });

  it('com a Empresa suspensa mostra o contador de Conversas', async () => {
    companyService.getStatus.mockResolvedValue(companyStatus({ status: 'SUSPENDED' }));
    conversationService.list.mockResolvedValue([conversation({ unreadCount: 4 })]);
    renderApp('/conta', signedInStore('RECRUITER'));

    expect(await screen.findByLabelText('4 mensagens por ler')).toBeInTheDocument();
  });
});
