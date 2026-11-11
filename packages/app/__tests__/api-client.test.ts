import { ApiError, createApiClient } from '../src/api/client';

function fetchReturning(body: unknown, status = 200) {
  return jest.fn(
    async (_url: string) => new Response(JSON.stringify(body), { status }),
  );
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

describe('device registration', () => {
  const DEVICE_ID = '7b0a1c2e-3f4d-4a5b-8c6d-9e0f1a2b3c4d';

  it('puts the device as JSON', async () => {
    const fetchFn = fetchReturning({ id: DEVICE_ID });
    const body = {
      platform: 'web' as const,
      token: 'tok',
      level: 'student' as const,
      alertTime: '19:00' as const,
      alertSiteIds: [],
    };

    await createApiClient('', fetchFn).putDevice(DEVICE_ID, body);

    const [url, init] = fetchFn.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`/v1/devices/${DEVICE_ID}`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body as string)).toEqual(body);
  });

  it('deletes the device and accepts an empty 204 reply', async () => {
    const fetchFn = jest.fn(
      async (_url: string) => new Response(null, { status: 204 }),
    );

    await createApiClient('', fetchFn).deleteDevice(DEVICE_ID);

    const [url, init] = fetchFn.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(`/v1/devices/${DEVICE_ID}`);
    expect(init.method).toBe('DELETE');
  });

  it('reads the push config', async () => {
    const fetchFn = fetchReturning({ webPushPublicKey: 'key' });
    await expect(createApiClient('', fetchFn).getPushConfig()).resolves.toEqual(
      {
        webPushPublicKey: 'key',
      },
    );
    expect(fetchFn.mock.calls[0]![0]).toBe('/v1/push/config');
  });
});

describe('getWindGrid', () => {
  it('passes the view, height and time', async () => {
    const fetchFn = fetchReturning({});
    await createApiClient('', fetchFn).getWindGrid({
      bbox: '83,27,86,29',
      zoom: 7,
      height: 2000,
      time: '2026-10-30T05:15:00.000Z',
    });
    expect(fetchFn.mock.calls[0]![0]).toBe(
      '/v1/wind-grid?bbox=83%2C27%2C86%2C29&zoom=7&height=2000&time=2026-10-30T05%3A15%3A00.000Z',
    );
  });
});
