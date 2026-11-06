import { useContext } from 'react';
import { ConversationsContext, type ConversationsState } from './ConversationsProvider';

/** Lê o estado da área de conversas, partilhado com o contador da barra lateral (DF-14). */
export function useConversations(): ConversationsState {
  const state = useContext(ConversationsContext);
  if (state === null) {
    throw new Error('useConversations exige o ConversationsProvider.');
  }
  return state;
}
