import { ApiError, createApiClient } from '../src/api/client';

function fetchReturning(body: unknown, status = 200) {
  return jest.fn(async (_url: string) => new Response(JSON.stringify(body), { status }));
}

describe('createApiClient', () => {
  it('builds the site list URL with only the given params', async () => {
    const fetchFn = fetchReturning({
      items: [],
      total: 0,
      limit: 10,
      offset: 0,
    });
    const api = createApiClient('https://api.example.test', fetchFn);

    await api.listSites({ level: 'pilot', limit: 10 });
    await api.listSites();

    expect(fetchFn.mock.calls.map(([url]) => url)).toEqual([
      'https://api.example.test/v1/sites?level=pilot&limit=10',
      'https://api.example.test/v1/sites',
    ]);
  });

  it('encodes the site id in forecast URLs', async () => {
    const fetchFn = fetchReturning({});
    await createApiClient('', fetchFn).getForecast('a/b', { days: 2 });
    expect(fetchFn.mock.calls[0]![0]).toBe('/v1/sites/a%2Fb/forecast?days=2');
  });

  it('throws an ApiError with the status on failure', async () => {
    const api = createApiClient('', fetchReturning({ message: 'nope' }, 404));
    await expect(api.getSite('x')).rejects.toBeInstanceOf(ApiError);
    await expect(api.getSite('x')).rejects.toMatchObject({ status: 404 });
  });
});

describe('getWindGrid', () => {
  it('passes the height and time', async () => {
    const fetchFn = fetchReturning({});
    await createApiClient('', fetchFn).getWindGrid({
      height: 2000,
      time: '2026-10-30T05:15:00.000Z',
    });
    expect(fetchFn.mock.calls[0]![0]).toBe(
      '/v1/wind-grid?height=2000&time=2026-10-30T05%3A15%3A00.000Z',
    );
  });
});
