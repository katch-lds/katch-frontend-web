import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
 * Montado na moldura do Recrutador: lê a lista uma vez ao montar (contador da barra lateral, DF-14) e, enquanto a
 * página de conversas o pede, repete de 3 em 3 segundos a lista e a conversa escolhida (RF073, P17).
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
  const after = useRef<string | null>(null);

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
  }, [refreshList]);

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
      after.current = null;
      setOpenMatchId(matchId);
      setMessages([]);
      setMessagesError(null);
      setActionError(null);
      setMessagesLoading(matchId !== null);
      if (matchId === null) {
        return;
      }
      let firstLoad = true;
      messagesLoop.current = new PollingLoop(async () => {
        try {
          const received = await conversationService.open(matchId, after.current);
          if (generation.current !== mine) {
            return;
          }
          if (received.length > 0) {
            after.current = received[received.length - 1].sentAt;
            setMessages((current) => mergeMessages(current, received));
          }
          setMessagesError(null);
          if (firstLoad) {
            firstLoad = false;
            // A abertura marcou as mensagens como lidas (RF109): o contador atualiza-se sem esperar pela lista.
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
    [refreshList],
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
          setMessages((current) => mergeMessages(current, [sent]));
        }
      }),
    [runAction],
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

/** Junta por `messageId`, sem duplicados, e ordena por envio (a própria mensagem pode voltar na consulta seguinte). */
export function mergeMessages(current: MessageDto[], received: MessageDto[]): MessageDto[] {
  const known = new Set(current.map((m) => m.messageId));
  const added = received.filter((m) => !known.has(m.messageId));
  if (added.length === 0) {
    return current;
  }
  return [...current, ...added].sort((a, b) => Date.parse(a.sentAt) - Date.parse(b.sentAt));
}
