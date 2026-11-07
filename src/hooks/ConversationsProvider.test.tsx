import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { conversation, message, RECRUITER_ID } from '../../test/fixtures';
import { ApiError } from '../api/ApiError';
import { conversationService } from '../services';
import type { MessageDto } from '../types/api';
import { ConversationsProvider, mergeMessages } from './ConversationsProvider';
import { useConversations } from './useConversations';

jest.mock('../services', () => ({
  conversationService: { list: jest.fn(), open: jest.fn(), send: jest.fn(), close: jest.fn() },
}));

const service = jest.mocked(conversationService);

const wrapper = ({ children }: { children: ReactNode }) => (
  <ConversationsProvider userId={RECRUITER_ID}>{children}</ConversationsProvider>
);

/** Avança o relógio simulado e deixa terminar os pedidos resolvidos entretanto. */
const advance = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms));

async function renderProvider() {
  const rendered = renderHook(() => useConversations(), { wrapper });
  await advance(0);
  return rendered;
}

const m1 = message('m1', '2026-11-05T09:14:00+00:00');
const m2 = message('m2', '2026-11-05T09:22:00+00:00', { senderId: RECRUITER_ID });
const m3 = message('m3', '2026-11-05T09:27:00+00:00');

beforeEach(() => {
  jest.useFakeTimers();
  jest.resetAllMocks();
  service.list.mockResolvedValue([
    conversation({ unreadCount: 2 }),
    conversation({ matchId: 'match-2', unreadCount: 1 }),
  ]);
  service.open.mockResolvedValue([]);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ConversationsProvider', () => {
  it('lê a lista ao montar e soma as mensagens por ler para a barra lateral, sem repetir', async () => {
    const { result } = await renderProvider();

    expect(result.current.data).toHaveLength(2);
    expect(result.current.unreadTotal).toBe(3);
    await advance(10000);
    expect(service.list).toHaveBeenCalledTimes(1);
  });

  it('repete a lista de 3 em 3 segundos só enquanto a página de conversas a vigia (RF073)', async () => {
    const { result } = await renderProvider();

    act(() => result.current.watchList(true));
    await advance(0);
    expect(service.list).toHaveBeenCalledTimes(2);
    await advance(2999);
    expect(service.list).toHaveBeenCalledTimes(2);
    await advance(1);
    expect(service.list).toHaveBeenCalledTimes(3);

    act(() => result.current.watchList(false));
    await advance(9000);
    expect(service.list).toHaveBeenCalledTimes(3);
  });

  it('abre a conversa sem after e consulta a seguir com o sentAt da última mensagem recebida', async () => {
    service.open
      .mockResolvedValueOnce([m1, m2])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([m3]);
    const { result } = await renderProvider();

    act(() => result.current.select('match-1'));
    await advance(0);
    expect(service.open).toHaveBeenNthCalledWith(1, 'match-1', null);
    expect(result.current.messages).toEqual([m1, m2]);
    expect(result.current.openConversation?.matchId).toBe('match-1');

    await advance(3000);
    expect(service.open).toHaveBeenNthCalledWith(2, 'match-1', m2.sentAt);
    await advance(3000);
    expect(service.open).toHaveBeenNthCalledWith(3, 'match-1', m2.sentAt);
    expect(result.current.messages).toEqual([m1, m2, m3]);
  });

  it('lê de novo a lista logo depois de abrir a conversa, que marcou as mensagens como lidas (RF109)', async () => {
    const { result } = await renderProvider();
    service.list.mockResolvedValue([conversation({ unreadCount: 0 })]);

    act(() => result.current.select('match-1'));
    await advance(0);

    expect(service.list).toHaveBeenCalledTimes(2);
    expect(result.current.unreadTotal).toBe(0);
  });

  it('descarta a resposta da conversa anterior quando o Recrutador escolhe outra', async () => {
    let resolveFirst: (messages: MessageDto[]) => void = () => undefined;
    service.open
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce([m3]);
    const { result } = await renderProvider();

    act(() => result.current.select('match-1'));
    await advance(0);
    act(() => result.current.select('match-2'));
    await advance(0);
    await act(async () => resolveFirst([m1]));

    expect(result.current.openMatchId).toBe('match-2');
    expect(result.current.messages).toEqual([m3]);
  });

  it('acrescenta a mensagem enviada uma só vez, mesmo que a consulta seguinte a devolva', async () => {
    service.open.mockResolvedValueOnce([m1]).mockResolvedValueOnce([m2]);
    service.send.mockResolvedValue(m2);
    const { result } = await renderProvider();
    act(() => result.current.select('match-1'));
    await advance(0);

    let sent = false;
    await act(async () => {
      sent = await result.current.send('Olá, Ana.');
    });
    await advance(3000);

    expect(sent).toBe(true);
    expect(service.send).toHaveBeenCalledWith('match-1', { content: 'Olá, Ana.' });
    expect(result.current.messages).toEqual([m1, m2]);
  });

  it('com a conversa encerrada (ERR-36), mostra o erro e lê o estado sem esperar pela consulta', async () => {
    service.send.mockRejectedValue(new ApiError(409, 'A conversa está encerrada.', 'ERR-36'));
    const { result } = await renderProvider();
    act(() => result.current.select('match-1'));
    await advance(0);
    const listCalls = service.list.mock.calls.length;

    let sent = true;
    await act(async () => {
      sent = await result.current.send('Olá');
    });

    expect(sent).toBe(false);
    expect(result.current.actionError?.code).toBe('ERR-36');
    expect(service.list.mock.calls.length).toBe(listCalls + 1);
  });

  it('encerra a conversa escolhida e lê de novo a lista (RF074)', async () => {
    service.close.mockResolvedValue(undefined);
    const { result } = await renderProvider();
    act(() => result.current.select('match-1'));
    await advance(0);
    service.list.mockResolvedValue([
      conversation({ status: 'CLOSED', closeReason: 'CLOSED_BY_PARTY', closedBy: RECRUITER_ID }),
    ]);

    await act(() => result.current.close());

    expect(service.close).toHaveBeenCalledWith('match-1');
    expect(result.current.openConversation?.status).toBe('CLOSED');
  });

  it('não envia sem conversa escolhida e guarda o erro de uma abertura falhada', async () => {
    service.open.mockRejectedValue(new ApiError(403, 'Sem acesso.', 'ERR-08'));
    const { result } = await renderProvider();

    await act(async () => {
      expect(await result.current.send('Olá')).toBe(false);
    });
    act(() => result.current.select('match-1'));
    await advance(0);

    expect(service.send).not.toHaveBeenCalled();
    expect(result.current.messagesError?.code).toBe('ERR-08');
    expect(result.current.messagesLoading).toBe(false);
  });

  it('guarda o erro da lista e para as consultas ao desmontar', async () => {
    service.list.mockRejectedValue(new ApiError(403, 'Acesso negado.', 'ERR-06'));
    const { result, unmount } = await renderProvider();
    expect(result.current.error?.code).toBe('ERR-06');
    act(() => {
      result.current.watchList(true);
      result.current.select('match-1');
    });
    await advance(0);
    const calls = service.list.mock.calls.length + service.open.mock.calls.length;

    unmount();
    await advance(9000);

    expect(service.list.mock.calls.length + service.open.mock.calls.length).toBe(calls);
  });

  it('exige o ConversationsProvider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useConversations())).toThrow('ConversationsProvider');
  });
});

describe('mergeMessages', () => {
  it('junta sem duplicados e ordena pela data de envio', () => {
    expect(mergeMessages([m1, m3], [m3, m2])).toEqual([m1, m2, m3]);
  });

  it('devolve a mesma lista quando não há mensagens novas', () => {
    const current = [m1];

    expect(mergeMessages(current, [m1])).toBe(current);
  });
});
