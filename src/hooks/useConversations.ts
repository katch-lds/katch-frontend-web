import { useContext } from 'react';
import { ConversationsContext, type ConversationsState } from './ConversationsProvider';

/**
 * Estado da área de conversas.
 *
 * Partilhado com o contador da barra lateral (DF-14); exige o `ConversationsProvider`.
 *
 * @returns O estado e as ações do `ConversationsProvider` mais próximo.
 */
export function useConversations(): ConversationsState {
  const state = useContext(ConversationsContext);
  if (state === null) {
    throw new Error('useConversations exige o ConversationsProvider.');
  }
  return state;
}
