import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useConversations } from '../hooks/useConversations';
import type { ConversationSummaryDto, MessageDto } from '../types/api';
import { conversationCloseReasonLabels } from '../types/labels';
import { formatDateTime } from '../utils/date';
import './recruiter.css';

/** Dimensão máxima de uma mensagem (P03). */
const MAX_MESSAGE_LENGTH = 1000;

/**
 * W22 e W23 — lista de conversas com as mensagens por ler, conversa escolhida com o histórico, envio e encerramento;
 * enquanto a página está aberta, a lista e a conversa são atualizadas por consulta periódica (RF068 a RF075, RF109).
 */
export default function ConversationsPage() {
  const { data, loading, error, reload, watchList, select } = useConversations();
  const [params, setParams] = useSearchParams();
  const matchId = params.get('match');

  useEffect(() => {
    watchList(true);
    return () => watchList(false);
  }, [watchList]);

  useEffect(() => {
    select(matchId);
    return () => select(null);
  }, [select, matchId]);

  return (
    <section className="recruiter-page">
      <h1>Conversas</h1>
      {loading && <p>A carregar as conversas…</p>}
      {error && data === null && (
        <div role="alert" className="alert">
          <p>{error.message}</p>
          <button type="button" onClick={reload}>
            Tentar de novo
          </button>
        </div>
      )}
      {data && (
        <div className="conversations">
          <ConversationList
            conversations={data}
            activeMatchId={matchId}
            onSelect={(id) => setParams({ match: id })}
          />
          {matchId === null ? (
            <p className="conversation-placeholder">Escolha uma conversa da lista.</p>
          ) : (
            <ConversationPanel />
          )}
        </div>
      )}
    </section>
  );
}

interface ConversationListProps {
  conversations: ConversationSummaryDto[];
  activeMatchId: string | null;
  onSelect: (matchId: string) => void;
}

function ConversationList({
  conversations,
  activeMatchId,
  onSelect,
}: Readonly<ConversationListProps>) {
  if (conversations.length === 0) {
    return (
      <p className="empty-state conversation-list">
        Ainda não há conversas. Cada match confirmado abre uma conversa.
      </p>
    );
  }
  return (
    <ul className="conversation-list" aria-label="Lista de conversas">
      {conversations.map((c) => (
        <li key={c.matchId}>
          <button
            type="button"
            className="conversation-item"
            aria-current={c.matchId === activeMatchId ? 'true' : undefined}
            onClick={() => onSelect(c.matchId)}
          >
            <span className="conversation-name">{c.counterpartName}</span>
            <span className="conversation-job">{c.jobTitle}</span>
            {c.status === 'CLOSED' && <span className="tag">Encerrada</span>}
            {c.unreadCount > 0 && <span className="unread">{c.unreadCount} por ler</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

function ConversationPanel() {
  const {
    userId,
    openConversation,
    messages,
    messagesLoading,
    messagesError,
    actionError,
    busy,
    send,
    close,
  } = useConversations();
  const readOnly = openConversation?.status === 'CLOSED';

  return (
    <div className="conversation-panel">
      <header className="conversation-header">
        <div>
          <strong>{openConversation?.counterpartName}</strong>
          <span className="conversation-job">{openConversation?.jobTitle}</span>
        </div>
        <button
          type="button"
          onClick={() => void close()}
          disabled={openConversation === null || readOnly || busy}
        >
          Encerrar conversa
        </button>
      </header>
      {readOnly && openConversation && (
        <output className="closed-banner">
          Conversa encerrada. Apenas consulta. {closedDetail(openConversation, userId)}.
        </output>
      )}
      {messagesError && (
        <p role="alert" className="alert">
          {messagesError.message}
        </p>
      )}
      <MessageThread messages={messages} userId={userId} loading={messagesLoading} />
      <Composer
        readOnly={readOnly}
        busy={busy}
        error={actionError?.fieldReason('content') ?? actionError?.message ?? null}
        onSend={send}
      />
    </div>
  );
}

/** Quem ou o que encerrou a conversa (secção 3.1: «por si», «pelo Candidato» ou o motivo automático). */
function closedDetail(conversation: ConversationSummaryDto, userId: string): string {
  if (conversation.closeReason === 'CLOSED_BY_PARTY') {
    return conversation.closedBy === userId ? 'Encerrada por si' : 'Encerrada pelo Candidato';
  }
  return conversation.closeReason
    ? conversationCloseReasonLabels[conversation.closeReason]
    : 'Encerrada';
}

interface MessageThreadProps {
  messages: MessageDto[];
  userId: string;
  loading: boolean;
}

function MessageThread({ messages, userId, loading }: Readonly<MessageThreadProps>) {
  const thread = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (thread.current) {
      thread.current.scrollTop = thread.current.scrollHeight;
    }
  }, [messages.length]);

  if (loading) {
    return <p className="message-thread">A carregar as mensagens…</p>;
  }
  return (
    <ol className="message-thread" ref={thread} aria-label="Mensagens">
      {messages.length === 0 && <li className="note">Ainda não há mensagens nesta conversa.</li>}
      {messages.map((m) => (
        <li key={m.messageId} className={m.senderId === userId ? 'message own' : 'message'}>
          <p>{m.content}</p>
          <small>
            <time dateTime={m.sentAt}>{formatDateTime(m.sentAt)}</time>
            {m.readAt && <strong> Lida</strong>}
          </small>
        </li>
      ))}
    </ol>
  );
}

interface ComposerProps {
  readOnly: boolean;
  busy: boolean;
  error: string | null;
  onSend: (content: string) => Promise<boolean>;
}

function Composer({ readOnly, busy, error, onSend }: Readonly<ComposerProps>) {
  const [draft, setDraft] = useState('');
  const canSend = !readOnly && !busy && draft.trim().length > 0;

  const submit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (canSend && (await onSend(draft))) {
      setDraft('');
    }
  };

  const submitOnEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      void submit(event);
    }
  };

  return (
    <form className="composer" onSubmit={(event) => void submit(event)}>
      <label htmlFor="message">Mensagem</label>
      <div className="composer-row">
        <textarea
          id="message"
          rows={2}
          maxLength={MAX_MESSAGE_LENGTH}
          value={draft}
          disabled={readOnly}
          placeholder={readOnly ? 'Conversa encerrada' : 'Escreva uma mensagem'}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={submitOnEnter}
        />
        <button type="submit" disabled={!canSend}>
          Enviar
        </button>
      </div>
      <small>
        {draft.length}/{MAX_MESSAGE_LENGTH}
      </small>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </form>
  );
}
