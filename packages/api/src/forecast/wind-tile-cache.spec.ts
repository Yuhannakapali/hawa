import type { DataSource } from 'typeorm';
import { WindTileFetch } from '../db/entities/wind-tile-fetch.entity.js';
import { WindTileFrame } from '../db/entities/wind-tile-frame.entity.js';
import { TEST_MODEL } from '../testing/fixtures.js';
import { createTestDb } from '../testing/test-db.js';
import type { GridPoint, WindFrame, WindGridSource } from '../weather/wind-grid.js';
import { fineTile, tilePoints } from '../weather/wind-tiles.js';
import { WindTileCache } from './wind-tile-cache.js';

const START = new Date('2026-10-30T02:00:00Z');
const HOUR_MS = 60 * 60 * 1000;
const FRAME_TIME = new Date('2026-10-30T03:15:00Z');
const TILE_A = fineTile(28, 80);
const TILE_B = fineTile(28, 84);
const CALLS_PER_POINT = 1.4;
const TILE_CALLS = 81 * CALLS_PER_POINT;

class FakeGridSource implements WindGridSource {
  readonly model = TEST_MODEL;
  readonly callsPerPoint = CALLS_PER_POINT;
  calls: GridPoint[][] = [];
  speed = 10;
  failing = false;

  async fetchGrid(points: GridPoint[]): Promise<WindFrame[]> {
    this.calls.push(points);
    if (this.failing) {
      throw new Error('Open-Meteo request failed with 503');
    }
    return [10, 2000].map((heightM) => ({
      timeUtc: FRAME_TIME,
      heightM,
      u: points.map(() => this.speed),
      v: points.map(() => 0),
    }));
  }
}

describe('WindTileCache', () => {
  let db: DataSource;
  let now: Date;
  let source: FakeGridSource;

  function cache(dailyCallBudget = 10_000) {
    return new WindTileCache(db, source, {
      ttlMs: 3 * HOUR_MS,
      dailyCallBudget,
      now: () => now,
    });
  }

  beforeEach(async () => {
    db = await createTestDb();
    now = START;
    source = new FakeGridSource();
  });

  afterEach(() => db.destroy());

  it('fetches a missing tile once and logs its cost', async () => {
    await cache().ensure([TILE_A]);
    await cache().ensure([TILE_A]);

    expect(source.calls).toEqual([tilePoints(TILE_A)]);
    const fetches = await db.getRepository(WindTileFetch).find();
    expect(fetches).toHaveLength(1);
    expect(fetches[0]).toMatchObject({ tileKey: TILE_A.key, model: TEST_MODEL, fetchedAt: START });
    expect(fetches[0]!.calls).toBeCloseTo(TILE_CALLS);
    expect(await db.getRepository(WindTileFrame).count()).toBe(2);
  });

  it('refetches a tile after it goes stale', async () => {
    await cache().ensure([TILE_A]);
    now = new Date(START.getTime() + 4 * HOUR_MS);
    source.speed = 20;
    await cache().ensure([TILE_A]);

    expect(source.calls).toHaveLength(2);
    const frame = await cache().frame([TILE_A], 10);
    expect(frame?.u[0]).toBe(20);
  });

  it('shares one fetch between concurrent requests for the same tile', async () => {
    const shared = cache();
    await Promise.all([shared.ensure([TILE_A]), shared.ensure([TILE_A])]);
    expect(source.calls).toHaveLength(1);
  });

  it('stops fetching once the daily budget is spent and keeps serving the cache', async () => {
    const budget = TILE_CALLS * 1.5;
    await cache(budget).ensure([TILE_A]);
    now = new Date(START.getTime() + 4 * HOUR_MS);
    await cache(budget).ensure([TILE_A, TILE_B]);

    expect(source.calls).toHaveLength(1);
    const frame = await cache(budget).frame([TILE_A, TILE_B], 10);
    expect(frame?.u[0]).toBe(10);
    expect(frame?.u[frame.grid.nLon - 1]).toBeNull();
  });

  it('keeps serving the cache when the source fails', async () => {
    await cache().ensure([TILE_A]);
    now = new Date(START.getTime() + 4 * HOUR_MS);
    source.failing = true;

    await expect(cache().ensure([TILE_A])).resolves.toBeUndefined();
    expect((await cache().frame([TILE_A], 10))?.u[0]).toBe(10);
  });

  it('merges tiles into one grid with times and the oldest fetch time', async () => {
    await cache().ensure([TILE_A]);
    now = new Date(START.getTime() + HOUR_MS);
    source.speed = 30;
    await cache().ensure([TILE_B]);

    const frame = await cache().frame([TILE_A, TILE_B], 2000, new Date('2026-10-30T09:00:00Z'));

    expect(frame).toMatchObject({
      grid: { latMin: 28, lonMin: 80, step: 0.5, nLat: 9, nLon: 17 },
      time: FRAME_TIME,
      times: [FRAME_TIME],
      fetchedAt: START,
    });
    expect(frame?.u[0]).toBe(10);
    expect(frame?.u[16]).toBe(30);
    expect(frame?.u).toHaveLength(9 * 17);
  });

  it('returns null when none of the tiles have data', async () => {
    expect(await cache().frame([TILE_A], 10)).toBeNull();
  });

  it('prunes frames and fetch logs older than 7 days', async () => {
    await cache().ensure([TILE_A]);
    now = new Date(START.getTime() + 8 * 24 * HOUR_MS);

    await cache().prune();

    expect(await db.getRepository(WindTileFrame).count()).toBe(0);
    expect(await db.getRepository(WindTileFetch).count()).toBe(0);
  });
});
