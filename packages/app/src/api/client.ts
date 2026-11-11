import type {
  DeviceRequest,
  DeviceResponse,
  ForecastResponse,
  Page,
  PilotLevel,
  PushConfigResponse,
  SiteDetail,
  SiteSummary,
  StatusResponse,
  WindGridResponse,
} from '@hawa/contracts';

export class ApiError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
type Query = Record<string, string | number | undefined>;

export interface ApiClient {
  listSites(query?: {
    level?: PilotLevel;
    limit?: number;
    offset?: number;
  }): Promise<Page<SiteSummary>>;
  getSite(id: string): Promise<SiteDetail>;
  getForecast(
    id: string,
    query?: { level?: PilotLevel; days?: number },
  ): Promise<ForecastResponse>;
  getStatus(): Promise<StatusResponse>;
  getWindGrid(query: {
    bbox: string;
    zoom: number;
    height?: number;
    time?: string;
  }): Promise<WindGridResponse>;
  getPushConfig(): Promise<PushConfigResponse>;
  putDevice(id: string, body: DeviceRequest): Promise<DeviceResponse>;
  deleteDevice(id: string): Promise<void>;
}

function withQuery(path: string, query: Query = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }
  const search = params.toString();
  if (search === '') {
    return path;
  }
  return `${path}?${search}`;
}

export function createApiClient(
  baseUrl: string,
  fetchFn: FetchFn = (url, init) => fetch(url, init),
): ApiClient {
  async function get<T>(path: string, query?: Query): Promise<T> {
    const res = await fetchFn(`${baseUrl}${withQuery(path, query)}`);
    if (!res.ok) {
      throw new ApiError(
        res.status,
        `Request to ${path} failed with ${res.status}`,
      );
    }
    return (await res.json()) as T;
  }

  async function send(
    method: 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<Response> {
    const init: RequestInit = { method };
    if (body !== undefined) {
      init.headers = { 'Content-Type': 'application/json' };
      init.body = JSON.stringify(body);
    }
    const res = await fetchFn(`${baseUrl}${path}`, init);
    if (!res.ok) {
      throw new ApiError(
        res.status,
        `${method} ${path} failed with ${res.status}`,
      );
    }
    return res;
  }

  function devicePath(id: string): string {
    return `/v1/devices/${encodeURIComponent(id)}`;
  }

  return {
    listSites: query => get('/v1/sites', query),
    getSite: id => get(`/v1/sites/${encodeURIComponent(id)}`),
    getForecast: (id, query) =>
      get(`/v1/sites/${encodeURIComponent(id)}/forecast`, query),
    getStatus: () => get('/v1/status'),
    getWindGrid: query => get('/v1/wind-grid', query),
    getPushConfig: () => get('/v1/push/config'),
    putDevice: async (id, body) =>
      (await send('PUT', devicePath(id), body)).json(),
    deleteDevice: async id => {
      await send('DELETE', devicePath(id));
    },
  };
}
