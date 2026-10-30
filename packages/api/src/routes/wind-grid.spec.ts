import type { FastifyInstance } from 'fastify';
import type { DataSource } from 'typeorm';
import { buildApp } from '../app.js';
import { insertWindFrame, TEST_MODEL } from '../testing/fixtures.js';
import { createTestDb } from '../testing/test-db.js';
import { WIND_GRID } from '../weather/wind-grid.js';

const NOW = new Date('2026-10-30T04:00:00Z');
const HOUR_MS = 60 * 60 * 1000;

describe('GET /v1/wind-grid', () => {
  let db: DataSource;
  let app: FastifyInstance;

  beforeEach(async () => {
    db = await createTestDb();
    app = buildApp({ db, model: TEST_MODEL, now: () => NOW });
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  async function get(url: string) {
    const res = await app.inject({ method: 'GET', url });
    return { status: res.statusCode, body: res.json() };
  }

  const early = new Date(NOW.getTime() - 2 * HOUR_MS);
  const near = new Date(NOW.getTime() + 0.4 * HOUR_MS);
  const later = new Date(NOW.getTime() + 3 * HOUR_MS);

  async function seed() {
    await insertWindFrame(db, early, 10, { u: [1.26], v: [2] });
    await insertWindFrame(db, near, 10, { u: [3.04], v: [-4] });
    await insertWindFrame(db, later, 10, { u: [5], v: [6] });
    await insertWindFrame(db, near, 2000, { u: [20], v: [0] });
  }

  it('returns the frame nearest to now with the grid layout and available times', async () => {
    await seed();

    const { status, body } = await get('/v1/wind-grid');

    expect(status).toBe(200);
    expect(body).toEqual({
      heightM: 10,
      time: near.toISOString(),
      times: [early, near, later].map((t) => t.toISOString()),
      grid: WIND_GRID,
      u: [3],
      v: [-4],
      fetchedAt: near.toISOString(),
      credit: {
        text: 'Weather data by Open-Meteo.com',
        url: 'https://open-meteo.com/',
        license: 'CC BY 4.0',
      },
    });
  });

  it('returns the requested time and height', async () => {
    await seed();

    expect((await get(`/v1/wind-grid?time=${later.toISOString()}`)).body).toMatchObject({
      time: later.toISOString(),
      u: [5],
    });
    expect((await get('/v1/wind-grid?height=2000')).body).toMatchObject({
      heightM: 2000,
      time: near.toISOString(),
      times: [near.toISOString()],
      u: [20],
    });
  });

  it('rounds wind to one decimal', async () => {
    await seed();
    const { body } = await get(`/v1/wind-grid?time=${early.toISOString()}`);
    expect(body.u).toEqual([1.3]);
  });

  it('returns 404 when there is no grid yet and 400 for a bad height', async () => {
    expect((await get('/v1/wind-grid')).status).toBe(404);
    expect((await get('/v1/wind-grid?height=500')).status).toBe(400);
  });
});
