import { act, renderHook, waitFor } from '@testing-library/react';
import { publishedJob } from '../../test/fixtures';
import { adminCompanyService, resetServiceMocks } from '../../test/servicesMock';
import { usePublishedJobs } from './usePublishedJobs';

jest.mock('../services', () => jest.requireActual('../../test/servicesMock'));

beforeEach(() => resetServiceMocks());

describe('usePublishedJobs', () => {
  it('pagina no cliente com 12 linhas', async () => {
    adminCompanyService.listPublishedJobs.mockResolvedValue(
      Array.from({ length: 25 }, (_, index) => publishedJob(index + 1)),
    );
    const { result } = renderHook(() => usePublishedJobs());
    await waitFor(() => expect(result.current.pageCount).toBe(3));

    expect(result.current.page).toBe(1);
    expect(result.current.visibleRows).toHaveLength(12);

    act(() => result.current.goToPage(3));
    expect(result.current.visibleRows.map((row) => row.jobId)).toEqual(['job-25']);

    act(() => result.current.goToPage(99));
    expect(result.current.page).toBe(3);

    act(() => result.current.goToPage(0));
    expect(result.current.page).toBe(1);
  });

  it('sem vagas há uma só página vazia', async () => {
    adminCompanyService.listPublishedJobs.mockResolvedValue([]);
    const { result } = renderHook(() => usePublishedJobs());
    await waitFor(() => expect(result.current.data).toEqual([]));

    expect(result.current.pageCount).toBe(1);
    expect(result.current.visibleRows).toEqual([]);
  });
});
