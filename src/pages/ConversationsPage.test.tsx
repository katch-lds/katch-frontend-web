import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { conversation, message, RECRUITER_ID } from '../../test/fixtures';
import { ApiError } from '../api/ApiError';
import { ConversationsProvider } from '../hooks/ConversationsProvider';
import { conversationService } from '../services';
import ConversationsPage from './ConversationsPage';

jest.mock('../services', () => ({
  conversationService: { list: jest.fn(), open: jest.fn(), send: jest.fn(), close: jest.fn() },
}));

const service = jest.mocked(conversationService);

const advance = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

async function renderPage(url = '/conversas?match=match-1') {
  render(
    <MemoryRouter initialEntries={[url]}>
      <ConversationsProvider userId={RECRUITER_ID}>
        <ConversationsPage />
      </ConversationsProvider>
    </MemoryRouter>,
  );
  await advance(0);
}

const fromCandidate = message('m1', '2026-11-05T09:14:00+00:00', {
  content: 'Bom dia. Obrigada pelo contacto.',
  readAt: '2026-11-05T09:20:00+00:00',
});
const fromRecruiter = message('m2', '2026-11-05T09:22:00+00:00', {
  senderId: RECRUITER_ID,
  content: 'Bom dia, Ana. Tem disponibilidade?',
});

beforeEach(() => {
  jest.useFakeTimers();
  jest.resetAllMocks();
  service.list.mockResolvedValue([
    conversation({ unreadCount: 2 }),
    conversation({ matchId: 'match-2', counterpartName: 'Rui Costa', unreadCount: 1 }),
    conversation({
      matchId: 'match-3',
      counterpartName: 'Marta Lopes',
      status: 'CLOSED',
      closeReason: 'CLOSED_BY_PARTY',
      closedBy: RECRUITER_ID,
    }),
  ]);
  service.open.mockResolvedValue([]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ConversationsPage — lista', () => {
  it('indica as mensagens por ler e as conversas encerradas (RF071)', async () => {
    service.list.mockResolvedValue([
      conversation({ unreadCount: 2 }),
      conversation({ matchId: 'match-3', counterpartName: 'Marta Lopes', status: 'CLOSED' }),
    ]);
    await renderPage('/conversas');

    const items = within(screen.getByRole('list', { name: 'Lista de conversas' })).getAllByRole(
      'button',
    );
    expect(items[0]).toHaveTextContent('Ana Silva');
    expect(items[0]).toHaveTextContent('2 por ler');
    expect(items[1]).toHaveTextContent('Encerrada');
    expect(items[1]).not.toHaveTextContent('por ler');
    expect(screen.getByText('Escolha uma conversa da lista.')).toBeInTheDocument();
    expect(service.open).not.toHaveBeenCalled();
  });

  it('atualiza o número por ler por consulta periódica, sem recarregar a página (RF073)', async () => {
    await renderPage('/conversas');
    service.list.mockResolvedValue([conversation({ unreadCount: 3 })]);

    await advance(3000);

    expect(screen.getByText('3 por ler')).toBeInTheDocument();
  });

  it('abre a conversa escolhida na lista', async () => {
    await renderPage('/conversas');

    fireEvent.click(screen.getByRole('button', { name: /Rui Costa/ }));
    await advance(0);

    expect(service.open).toHaveBeenCalledWith('match-2', null);
    expect(screen.getByRole('button', { name: /Rui Costa/ })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('indica a lista vazia', async () => {
    service.list.mockResolvedValue([]);
    await renderPage('/conversas');

    expect(screen.getByText(/Ainda não há conversas/)).toBeInTheDocument();
  });

  it('mostra a recusa do servidor ao Administrador, sem conversas (RF103)', async () => {
    service.list.mockRejectedValue(new ApiError(403, 'Não tem acesso a esta área.', 'ERR-06'));
    await renderPage('/conversas');

    expect(screen.getByRole('alert')).toHaveTextContent('Não tem acesso a esta área.');
    expect(screen.queryByRole('list', { name: 'Lista de conversas' })).not.toBeInTheDocument();
  });
});

describe('ConversationsPage — conversa', () => {
  it('abre o histórico por ordem de envio, com data, hora e indicação de leitura (RF072)', async () => {
    service.open.mockResolvedValueOnce([fromCandidate, fromRecruiter]);
    await renderPage();

    const thread = within(screen.getByRole('list', { name: 'Mensagens' })).getAllByRole('listitem');
    expect(thread).toHaveLength(2);
    expect(thread[0]).toHaveTextContent('Bom dia. Obrigada pelo contacto.');
    expect(thread[0]).toHaveTextContent('05/11/2026 09:14');
    expect(thread[0]).toHaveTextContent('Lida');
    expect(thread[0]).not.toHaveClass('own');
    expect(thread[1]).toHaveClass('own');
    expect(thread[1]).not.toHaveTextContent('Lida');
  });

  it('mostra a mensagem nova do Candidato na consulta seguinte, sem recarregar (RF073)', async () => {
    service.open
      .mockResolvedValueOnce([fromCandidate])
      .mockResolvedValueOnce([
        message('m3', '2026-11-05T09:27:00+00:00', { content: 'Tenho disponibilidade imediata.' }),
      ]);
    await renderPage();
    expect(screen.queryByText('Tenho disponibilidade imediata.')).not.toBeInTheDocument();

    await advance(3000);

    expect(service.open).toHaveBeenLastCalledWith('match-1', fromCandidate.sentAt);
    expect(screen.getByText('Tenho disponibilidade imediata.')).toBeInTheDocument();
  });

  it('envia a mensagem, acrescenta-a ao histórico e limpa o campo (RF069)', async () => {
    service.send.mockResolvedValue(fromRecruiter);
    await renderPage();
    const field = screen.getByLabelText('Mensagem');
    const sendButton = screen.getByRole('button', { name: 'Enviar' });
    expect(sendButton).toBeDisabled();

    fireEvent.change(field, { target: { value: 'Bom dia, Ana. Tem disponibilidade?' } });
    expect(screen.getByText('34/1000')).toBeInTheDocument();
    fireEvent.click(sendButton);
    await advance(0);

    expect(service.send).toHaveBeenCalledWith('match-1', {
      content: 'Bom dia, Ana. Tem disponibilidade?',
    });
    expect(screen.getByText('Bom dia, Ana. Tem disponibilidade?')).toBeInTheDocument();
    expect(field).toHaveValue('');
  });

  it('envia com Enter e não envia uma mensagem só com espaços (P03)', async () => {
    service.send.mockResolvedValue(fromRecruiter);
    await renderPage();
    const field = screen.getByLabelText('Mensagem');
    expect(field).toHaveAttribute('maxLength', '1000');

    fireEvent.change(field, { target: { value: '   ' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
    fireEvent.change(field, { target: { value: 'Olá' } });
    fireEvent.keyDown(field, { key: 'Enter', shiftKey: true });
    expect(service.send).not.toHaveBeenCalled();
    fireEvent.keyDown(field, { key: 'Enter' });
    await advance(0);

    expect(service.send).toHaveBeenCalledTimes(1);
    expect(service.send).toHaveBeenCalledWith('match-1', { content: 'Olá' });
  });

  it('mostra a recusa do envio e mantém o texto escrito (RF070)', async () => {
    service.send.mockRejectedValue(
      new ApiError(409, 'Não existe match com o Candidato.', 'ERR-37'),
    );
    await renderPage();
    const field = screen.getByLabelText('Mensagem');

    fireEvent.change(field, { target: { value: 'Olá' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
    await advance(0);

    expect(screen.getByRole('alert')).toHaveTextContent('Não existe match com o Candidato.');
    expect(field).toHaveValue('Olá');
  });

  it('encerra a conversa (RF074)', async () => {
    service.close.mockResolvedValue(undefined);
    await renderPage();
    service.list.mockResolvedValue([
      conversation({ status: 'CLOSED', closeReason: 'CLOSED_BY_PARTY', closedBy: RECRUITER_ID }),
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Encerrar conversa' }));
    await advance(0);

    expect(service.close).toHaveBeenCalledWith('match-1');
    expect(
      screen.getByText(/Conversa encerrada. Apenas consulta. Encerrada por si/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Encerrar conversa' })).toBeDisabled();
  });

  it.each([
    ['CLOSED_BY_PARTY', 'candidate-1', 'Encerrada pelo Candidato'],
    ['ACCOUNT_BLOCKED_OR_SUSPENDED', null, 'Conta bloqueada ou suspensa'],
    ['COMPANY_SUSPENDED', null, 'Empresa suspensa'],
  ] as const)(
    'deixa a conversa encerrada (%s) só de consulta, com o motivo (RF074, RF075)',
    async (closeReason, closedBy, detail) => {
      service.list.mockResolvedValue([conversation({ status: 'CLOSED', closeReason, closedBy })]);
      service.open.mockResolvedValueOnce([fromCandidate]);
      await renderPage();

      expect(screen.getByText(new RegExp(`Apenas consulta. ${detail}`))).toBeInTheDocument();
      expect(screen.getByText('Bom dia. Obrigada pelo contacto.')).toBeInTheDocument();
      expect(screen.getByLabelText('Mensagem')).toBeDisabled();
      expect(screen.getByPlaceholderText('Conversa encerrada')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Encerrar conversa' })).toBeDisabled();
    },
  );

  it('mostra a recusa da abertura de uma conversa de outra Empresa', async () => {
    service.open.mockRejectedValue(
      new ApiError(403, 'O elemento pertence a outro titular.', 'ERR-08'),
    );
    await renderPage();

    expect(screen.getByRole('alert')).toHaveTextContent('O elemento pertence a outro titular.');
  });
});
