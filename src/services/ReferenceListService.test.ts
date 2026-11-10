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
