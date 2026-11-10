import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router';
import { ApiError } from '../api/ApiError';
import { PollingLoop } from '../polling/PollingLoop';
import { conversationService } from '../services';
import type { ConversationSummaryDto, MessageDto } from '../types/api';
import type { IResourceState } from './useResource';

/** Estado da área de conversas do Recrutador (modelo de classes do frontend web v02, secções 6 e 9). */
export interface ConversationsState extends IResourceState<ConversationSummaryDto[]> {
  /** Utilizador da sessão: distingue as mensagens próprias e quem encerrou a conversa. */
  userId: string;
  unreadTotal: number;
  openMatchId: string | null;
  openConversation: ConversationSummaryDto | null;
  messages: MessageDto[];
  messagesLoading: boolean;
  messagesError: ApiError | null;
  /** Erro do último envio ou encerramento. */
  actionError: ApiError | null;
  busy: boolean;
  watchList: (active: boolean) => void;
  select: (matchId: string | null) => void;
  send: (content: string) => Promise<boolean>;
  close: () => Promise<void>;
}

export const ConversationsContext = createContext<ConversationsState | null>(null);

interface ConversationsProviderProps {
  userId: string;
  children: ReactNode;
}

/**
 * Montado na moldura do Recrutador: lê a lista ao montar e de cada vez que o Recrutador muda de página (contador da
 * barra lateral, DF-14) e, enquanto a página de conversas o pede, repete de 3 em 3 segundos a lista e a conversa
 * escolhida (RF073, P17).
 */
export function ConversationsProvider({ userId, children }: Readonly<ConversationsProviderProps>) {
  const [conversations, setConversations] = useState<ConversationSummaryDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [openMatchId, setOpenMatchId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<ApiError | null>(null);
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [busy, setBusy] = useState(false);

  const listLoop = useRef<PollingLoop | null>(null);
  const messagesLoop = useRef<PollingLoop | null>(null);
  const selected = useRef<string | null>(null);
  /** Muda em cada escolha: a resposta de uma consulta de outra escolha é descartada. */
  const generation = useRef(0);
  /** Histórico da conversa escolhida, para calcular o `after` e saber se uma consulta trouxe mensagens novas. */
  const thread = useRef<MessageDto[]>([]);
  const { pathname } = useLocation();

  const refreshList = useCallback(
    (): Promise<void> =>
      conversationService.list().then(
        (list) => {
          setConversations(list);
          setError(null);
          setLoading(false);
        },
        (caught: unknown) => {
          setError(ApiError.from(caught));
          setLoading(false);
        },
      ),
    [],
  );

  useEffect(() => {
    void refreshList();
  }, [refreshList, pathname]);

  /** Junta as mensagens recebidas ao histórico e diz se alguma é nova. */
  const applyMessages = useCallback((received: MessageDto[]): boolean => {
    const known = new Set(thread.current.map((m) => m.messageId));
    const hasNew = received.some((m) => !known.has(m.messageId));
    const merged = mergeMessages(thread.current, received);
    if (merged !== thread.current) {
      thread.current = merged;
      setMessages(merged);
    }
    return hasNew;
  }, []);

  useEffect(
    () => () => {
      listLoop.current?.stop();
      messagesLoop.current?.stop();
    },
    [],
  );

  const watchList = useCallback(
    (active: boolean) => {
      listLoop.current?.stop();
      listLoop.current = active ? new PollingLoop(refreshList) : null;
      listLoop.current?.start();
    },
    [refreshList],
  );

  const select = useCallback(
    (matchId: string | null) => {
      if (selected.current === matchId) {
        return;
      }
      messagesLoop.current?.stop();
      messagesLoop.current = null;
      selected.current = matchId;
      generation.current += 1;
      const mine = generation.current;
      thread.current = [];
      setOpenMatchId(matchId);
      setMessages([]);
      setMessagesError(null);
      setActionError(null);
      setMessagesLoading(matchId !== null);
      if (matchId === null) {
        return;
      }
      messagesLoop.current = new PollingLoop(async () => {
        try {
          const received = await conversationService.open(
            matchId,
            nextAfter(thread.current, userId),
          );
          if (generation.current !== mine) {
            return;
          }
          const hasNew = applyMessages(received);
          setMessagesError(null);
          if (hasNew) {
            // O servidor marcou como lidas as mensagens do Candidato (RF109): o contador atualiza-se já, sem esperar
            // pela consulta seguinte da lista.
            void refreshList();
          }
        } catch (caught) {
          if (generation.current === mine) {
            setMessagesError(ApiError.from(caught));
          }
        } finally {
          if (generation.current === mine) {
            setMessagesLoading(false);
          }
        }
      });
      messagesLoop.current.start();
    },
    [refreshList, applyMessages, userId],
  );

  const runAction = useCallback(
    async (action: (matchId: string) => Promise<void>): Promise<boolean> => {
      const matchId = selected.current;
      if (matchId === null) {
        return false;
      }
      setBusy(true);
      setActionError(null);
      try {
        await action(matchId);
        return true;
      } catch (caught) {
        const failure = ApiError.from(caught);
        setActionError(failure);
        // ERR-36/ERR-37: a conversa passou a só de consulta; lê-se o estado sem esperar pela consulta seguinte.
        if (failure.isConflict()) {
          void refreshList();
        }
        return false;
      } finally {
        setBusy(false);
      }
    },
    [refreshList],
  );

  const send = useCallback(
    (content: string) =>
      runAction(async (matchId) => {
        const sent = await conversationService.send(matchId, { content });
        if (selected.current === matchId) {
          applyMessages([sent]);
        }
      }),
    [runAction, applyMessages],
  );

  const close = useCallback(async () => {
    await runAction(async (matchId) => {
      await conversationService.close(matchId);
      await refreshList();
    });
  }, [runAction, refreshList]);

  const value = useMemo<ConversationsState>(
    () => ({
      data: conversations,
      loading,
      error,
      reload: () => void refreshList(),
      userId,
      unreadTotal: (conversations ?? []).reduce((total, c) => total + c.unreadCount, 0),
      openMatchId,
      openConversation: conversations?.find((c) => c.matchId === openMatchId) ?? null,
      messages,
      messagesLoading,
      messagesError,
      actionError,
      busy,
      watchList,
      select,
      send,
      close,
    }),
    [
      conversations,
      loading,
      error,
      refreshList,
      userId,
      openMatchId,
      messages,
      messagesLoading,
      messagesError,
      actionError,
      busy,
      watchList,
      select,
      send,
      close,
    ],
  );

  return <ConversationsContext.Provider value={value}>{children}</ConversationsContext.Provider>;
}

/**
 * Junta por `messageId`, sem duplicados, e ordena por envio. Uma mensagem já conhecida é substituída se a indicação de
 * leitura mudou (RF072); sem alterações devolve a mesma lista.
 */
export function mergeMessages(current: MessageDto[], received: MessageDto[]): MessageDto[] {
  const byId = new Map(current.map((m) => [m.messageId, m]));
  let changed = false;
  received.forEach((m) => {
    const known = byId.get(m.messageId);
    if (known === undefined || known.readAt !== m.readAt) {
      byId.set(m.messageId, m);
      changed = true;
    }
  });
  if (!changed) {
    return current;
  }
  return [...byId.values()].sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt));
}

/**
 * Instante `after` da consulta seguinte: o da última mensagem recebida (modelo de classes, secção 6, regra 3) ou,
 * enquanto houver mensagens do próprio Recrutador por ler, o da mensagem anterior à mais antiga delas, para a consulta
 * as devolver com a indicação de leitura do Candidato (RF072).
 */
export function nextAfter(messages: MessageDto[], userId: string): string | null {
  const unread = messages.findIndex((m) => m.senderId === userId && m.readAt === null);
  if (unread >= 0) {
    return unread === 0 ? null : messages[unread - 1].sentAt;
  }
  return messages.length === 0 ? null : messages[messages.length - 1].sentAt;
}
