/**
 * @jest-environment node
 */
import type { IApiClient } from '../api/IApiClient';
import { ConversationService } from './ConversationService';
import { MatchService } from './MatchService';

function fakeApi(): jest.Mocked<IApiClient> {
  return {
    get: jest.fn().mockResolvedValue([]),
    post: jest.fn().mockResolvedValue(undefined),
    put: jest.fn(),
    delete: jest.fn(),
    upload: jest.fn(),
    getFile: jest.fn(),
  };
}

describe('MatchService', () => {
  it('pede os matches em GET /api/matches', async () => {
    const api = fakeApi();

    await new MatchService(api).list();

    expect(api.get).toHaveBeenCalledWith('/api/matches');
  });
});

describe('ConversationService', () => {
  it('pede a lista em GET /api/conversations', async () => {
    const api = fakeApi();

    await new ConversationService(api).list();

    expect(api.get).toHaveBeenCalledWith('/api/conversations');
  });

  it('abre a conversa sem after e consulta com o after codificado (o + do fuso não pode virar espaço)', async () => {
    const api = fakeApi();
    const service = new ConversationService(api);

    await service.open('match-1');
    await service.open('match-1', '2026-11-05T09:27:00.1234567+00:00');

    expect(api.get).toHaveBeenNthCalledWith(1, '/api/conversations/match-1/messages');
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      '/api/conversations/match-1/messages?after=2026-11-05T09%3A27%3A00.1234567%2B00%3A00',
    );
  });

  it('envia a mensagem e encerra a conversa com POST', async () => {
    const api = fakeApi();
    const service = new ConversationService(api);

    await service.send('match-1', { content: 'Olá' });
    await service.close('match-1');

    expect(api.post).toHaveBeenNthCalledWith(1, '/api/conversations/match-1/messages', {
      content: 'Olá',
    });
    expect(api.post).toHaveBeenNthCalledWith(2, '/api/conversations/match-1/close');
  });
});
