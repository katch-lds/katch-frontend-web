import { apiClient } from '../api';
import { ConversationService } from './ConversationService';
import { MatchService } from './MatchService';

/** Instâncias únicas dos serviços, partilhadas pelos hooks (modelo de classes do frontend web v02, secção 9). */
export const matchService = new MatchService(apiClient);
export const conversationService = new ConversationService(apiClient);
