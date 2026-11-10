import type { IApiClient } from '../api/IApiClient';
import type { ConversationSummaryDto, MessageDto, SendMessageRequest } from '../types/api';

/** Conversas do Recrutador (ConversationsController; API v02, 6.8). */
export class ConversationService {
  constructor(private readonly api: IApiClient) {}

  list(): Promise<ConversationSummaryDto[]> {
    return this.api.get<ConversationSummaryDto[]>('/api/conversations');
  }

  /** Sem `after`, o histórico completo; com `after`, só as mensagens posteriores. O servidor marca-as como lidas. */
  open(matchId: string, after: string | null = null): Promise<MessageDto[]> {
    const query = after === null ? '' : `?after=${encodeURIComponent(after)}`;
    return this.api.get<MessageDto[]>(`${messagesPath(matchId)}${query}`);
  }

  send(matchId: string, request: SendMessageRequest): Promise<MessageDto> {
    return this.api.post<MessageDto>(messagesPath(matchId), request);
  }

  close(matchId: string): Promise<void> {
    return this.api.post<void>(`/api/conversations/${encodeURIComponent(matchId)}/close`);
  }
}

function messagesPath(matchId: string): string {
  return `/api/conversations/${encodeURIComponent(matchId)}/messages`;
}
