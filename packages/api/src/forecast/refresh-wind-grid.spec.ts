import type { DataSource } from 'typeorm';
import { WindGridFrame } from '../db/entities.js';
import { insertWindFrame, TEST_MODEL } from '../testing/fixtures.js';
import { createTestDb } from '../testing/test-db.js';
import {
  gridPoints,
  WIND_GRID,
  type GridPoint,
  type WindFrame,
  type WindGridSource,
} from '../weather/wind-grid.js';
import { pruneWindGrid, refreshWindGrid } from './refresh-wind-grid.js';

const NOW = new Date('2026-10-30T02:00:00Z');
const HOUR = new Date('2026-10-30T03:15:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;

class FakeGridSource implements WindGridSource {
  readonly model = TEST_MODEL;
  calls: { points: GridPoint[]; days: number }[] = [];

  constructor(private readonly frames: WindFrame[]) {}

  async fetchGrid(points: GridPoint[], days: number): Promise<WindFrame[]> {
    this.calls.push({ points, days });
    return this.frames;
  }
}

function frame(heightM: number, speed: number): WindFrame {
  const count = WIND_GRID.nLat * WIND_GRID.nLon;
  return {
    timeUtc: HOUR,
    heightM,
    u: Array.from({ length: count }, () => speed),
    v: Array.from({ length: count }, () => 0),
  };
}

describe('gridPoints', () => {
  it('lists points row by row from the south-west corner', () => {
    const points = gridPoints();
    expect(points).toHaveLength(WIND_GRID.nLat * WIND_GRID.nLon);
    expect(points[0]).toEqual({ lat: WIND_GRID.latMin, lon: WIND_GRID.lonMin });
    expect(points[1]).toEqual({ lat: WIND_GRID.latMin, lon: WIND_GRID.lonMin + WIND_GRID.step });
    expect(points[WIND_GRID.nLon]).toEqual({
      lat: WIND_GRID.latMin + WIND_GRID.step,
      lon: WIND_GRID.lonMin,
    });
  });
});

describe('refreshWindGrid', () => {
  let db: DataSource;

  beforeEach(async () => {
    db = await createTestDb();
  });

  afterEach(() => db.destroy());

  it('fetches the whole grid and stores one row per hour and height', async () => {
    const source = new FakeGridSource([frame(10, 5), frame(2000, 25)]);

    expect(await refreshWindGrid(db, source, NOW)).toBe(2);

    expect(source.calls).toEqual([{ points: gridPoints(), days: 3 }]);
    const rows = await db.getRepository(WindGridFrame).find({ order: { heightM: 'ASC' } });
    expect(rows.map((r) => [r.heightM, r.u[0], r.model, r.fetchedAt])).toEqual([
      [10, 5, TEST_MODEL, NOW],
      [2000, 25, TEST_MODEL, NOW],
    ]);
  });

  it('replaces a frame on the next run', async () => {
    await refreshWindGrid(db, new FakeGridSource([frame(10, 5)]), NOW);
    await refreshWindGrid(db, new FakeGridSource([frame(10, 9)]), NOW);

    const rows = await db.getRepository(WindGridFrame).find();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.u[0]).toBe(9);
  });

  it('prunes frames older than 7 days', async () => {
    const kept = new Date(NOW.getTime() - 6 * DAY_MS);
    await insertWindFrame(db, new Date(NOW.getTime() - 8 * DAY_MS), 10);
    await insertWindFrame(db, kept, 10);

    expect(await pruneWindGrid(db, NOW)).toBe(1);

    const rows = await db.getRepository(WindGridFrame).find();
    expect(rows.map((r) => r.timeUtc)).toEqual([kept]);
  });
});
