import type { IApiClient } from '../api/IApiClient';
import { ReferenceListService } from './ReferenceListService';

describe('ReferenceListService', () => {
  it('lista as localidades com GET /api/reference-lists/locations', async () => {
    const api = { get: jest.fn() } as unknown as jest.Mocked<IApiClient>;
    const locations = [{ id: 'l1', name: 'Braga (Braga)' }];
    api.get.mockResolvedValue(locations);

    const result = await new ReferenceListService(api).listLocations();

    expect(api.get).toHaveBeenCalledWith('/api/reference-lists/locations');
    expect(result).toBe(locations);
  });

  it.each([
    ['listSkills', '/api/reference-lists/skills'],
    ['listBenefits', '/api/reference-lists/benefits'],
  ] as const)('%s usa GET %s', async (operation, path) => {
    const api = { get: jest.fn() } as unknown as jest.Mocked<IApiClient>;
    api.get.mockResolvedValue([]);

    await new ReferenceListService(api)[operation]();

    expect(api.get).toHaveBeenCalledWith(path);
  });
});

// I073 — operações de escrita (API v02, 6.13.4 a 6.13.7).
describe('ReferenceListService (Administrador)', () => {
  function fakeWriteApi() {
    return { post: jest.fn(), put: jest.fn() } as unknown as jest.Mocked<IApiClient>;
  }

  it.each([
    ['addSkill', '/api/reference-lists/skills'],
    ['addBenefit', '/api/reference-lists/benefits'],
  ] as const)(
    '%s usa POST %s com a designação e devolve o item criado',
    async (operation, path) => {
      const api = fakeWriteApi();
      api.post.mockResolvedValue({ id: 'n1', name: 'Kubernetes' });

      const result = await new ReferenceListService(api)[operation]({ name: 'Kubernetes' });

      expect(api.post).toHaveBeenCalledWith(path, { name: 'Kubernetes' });
      expect(result).toEqual({ id: 'n1', name: 'Kubernetes' });
    },
  );

  it.each([
    ['renameSkill', '/api/reference-lists/skills/s%201'],
    ['renameBenefit', '/api/reference-lists/benefits/s%201'],
  ] as const)('%s usa PUT %s com a nova designação', async (operation, path) => {
    const api = fakeWriteApi();
    api.put.mockResolvedValue({ id: 's 1', name: 'Horário flexível' });

    const result = await new ReferenceListService(api)[operation]('s 1', {
      name: 'Horário flexível',
    });

    expect(api.put).toHaveBeenCalledWith(path, { name: 'Horário flexível' });
    expect(result.name).toBe('Horário flexível');
  });
});
