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
  it('mostra a barra lateral com Vagas, Matches, Conversas e «Terminar sessão»', async () => {
    renderApp('/matches', signedInStore('RECRUITER'));

    const nav = await screen.findByRole('navigation', { name: 'Navegação do Recrutador' });

    expect(within(nav).getByRole('link', { name: 'Vagas' })).toHaveAttribute('href', '/vagas');
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
