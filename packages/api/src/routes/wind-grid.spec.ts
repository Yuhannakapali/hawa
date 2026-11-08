import type { FastifyInstance } from 'fastify';
import type { DataSource } from 'typeorm';
import { buildApp } from '../app.js';
import { WindTileCache } from '../forecast/wind-tile-cache.js';
import { TEST_MODEL } from '../testing/fixtures.js';
import { createTestDb } from '../testing/test-db.js';
import type { GridPoint, WindFrame, WindGridSource } from '../weather/wind-grid.js';
import { coarseTile } from '../weather/wind-tiles.js';

const NOW = new Date('2026-10-30T04:00:00Z');
const HOUR_MS = 60 * 60 * 1000;
const NEPAL_BBOX = '83,27,86,29';
const FRAME_TIMES = [-2, 0.4, 3].map((h) => new Date(NOW.getTime() + h * HOUR_MS));

class FakeGridSource implements WindGridSource {
  readonly model = TEST_MODEL;
  readonly callsPerPoint = 1.4;

  async fetchGrid(points: GridPoint[]): Promise<WindFrame[]> {
    return FRAME_TIMES.flatMap((timeUtc, i) =>
      [10, 2000, 3000].map((heightM) => ({
        timeUtc,
        heightM,
        u: points.map(() => 12.36 + i + heightM / 1000),
        v: points.map(() => -4),
      })),
    );
  }
}

describe('GET /v1/wind-grid', () => {
  let db: DataSource;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = await createTestDb();
    const windTiles = new WindTileCache(db, new FakeGridSource(), {
      ttlMs: 3 * HOUR_MS,
      dailyCallBudget: 100_000,
      now: () => NOW,
    });
    app = buildApp({ db, model: TEST_MODEL, now: () => NOW, windTiles });
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  async function get(url: string) {
    const res = await app.inject({ method: 'GET', url });
    return { status: res.statusCode, body: res.json() };
  }

  it('returns the coarse regional grid when zoomed out', async () => {
    const { status, body } = await get(`/v1/wind-grid?bbox=${NEPAL_BBOX}&zoom=5`);

    const { key: _key, ...layout } = coarseTile();
    expect(status).toBe(200);
    expect(body).toMatchObject({
      heightM: 10,
      time: FRAME_TIMES[1]!.toISOString(),
      times: FRAME_TIMES.map((t) => t.toISOString()),
      grid: layout,
      fetchedAt: NOW.toISOString(),
      credit: { text: 'Weather data by Open-Meteo.com' },
    });
    expect(body.u).toHaveLength(layout.nLat * layout.nLon);
    expect(body.u[0]).toBe(13.4);
    expect(body.v[0]).toBe(-4);
  });

  it('merges the fine tiles under the view when zoomed in', async () => {
    const { body } = await get(`/v1/wind-grid?bbox=${NEPAL_BBOX}&zoom=7&height=2000`);

    expect(body.grid).toEqual({ latMin: 24, lonMin: 80, step: 0.5, nLat: 17, nLon: 17 });
    expect(body.heightM).toBe(2000);
    expect(body.u[0]).toBe(15.4);
  });

  it('returns the requested time', async () => {
    const later = FRAME_TIMES[2]!.toISOString();
    const { body } = await get(`/v1/wind-grid?bbox=${NEPAL_BBOX}&zoom=5&time=${later}`);
    expect(body.time).toBe(later);
    expect(body.u[0]).toBe(14.4);
  });

  it('returns 404 for a view outside the covered region', async () => {
    expect((await get('/v1/wind-grid?bbox=0,0,10,10&zoom=7')).status).toBe(404);
  });

  it.each([
    'zoom=7',
    `bbox=${NEPAL_BBOX}`,
    'bbox=86,27,83,29&zoom=7',
    'bbox=a,b,c,d&zoom=7',
    `bbox=${NEPAL_BBOX}&zoom=7&height=500`,
  ])('rejects %s', async (query) => {
    expect((await get(`/v1/wind-grid?${query}`)).status).toBe(400);
  });
});
