import type { WindGridLayout } from '@hawa/contracts';
import { In, LessThan, MoreThan, type DataSource } from 'typeorm';
import { WindTileFetch } from '../db/entities/wind-tile-fetch.entity.js';
import { WindTileFrame } from '../db/entities/wind-tile-frame.entity.js';
import type { WindGridSource } from '../weather/wind-grid.js';
import { mergeLayout, tilePoints, type TileSpec } from '../weather/wind-tiles.js';
import { FORECAST_DAYS, FORECAST_RETENTION_MS } from './refresh-forecasts.js';

const DAY_MS = 24 * 60 * 60 * 1000;
// After a failed fetch, wait before trying the same tile again so a dead upstream is not hammered.
const FAILURE_BACKOFF_MS = 5 * 60 * 1000;

export interface WindTileCacheOptions {
  ttlMs: number;
  dailyCallBudget: number;
  now: () => Date;
  onError?: (tileKey: string, error: unknown) => void;
}

export interface MergedWindFrame {
  grid: WindGridLayout;
  time: Date;
  times: Date[];
  u: (number | null)[];
  v: (number | null)[];
  fetchedAt: Date;
}

function distance(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime());
}

function nearest(times: Date[], target: Date): Date {
  let best = times[0]!;
  for (const time of times) {
    if (distance(time, target) < distance(best, target)) {
      best = time;
    }
  }
  return best;
}

export class WindTileCache {
  private readonly inFlight = new Map<string, Promise<void>>();
  private readonly lastFailure = new Map<string, number>();

  constructor(
    private readonly db: DataSource,
    private readonly source: WindGridSource,
    private readonly options: WindTileCacheOptions,
  ) {}

  async ensure(tiles: readonly TileSpec[]): Promise<void> {
    for (const tile of tiles) {
      await this.ensureTile(tile);
    }
  }

  async frame(
    tiles: readonly TileSpec[],
    heightM: number,
    time?: Date,
  ): Promise<MergedWindFrame | null> {
    const frames = this.db.getRepository(WindTileFrame);
    const where = {
      tileKey: In(tiles.map((tile) => tile.key)),
      heightM,
      model: this.source.model,
    };
    const available = await frames.find({ select: { timeUtc: true }, where });
    if (available.length === 0) {
      return null;
    }

    const times = [...new Set(available.map((f) => f.timeUtc.getTime()))]
      .sort((a, b) => a - b)
      .map((ms) => new Date(ms));
    const chosen = nearest(times, time ?? this.options.now());
    const rows = await frames.find({ where: { ...where, timeUtc: chosen } });

    const grid = mergeLayout(tiles);
    const size = grid.nLat * grid.nLon;
    const u: (number | null)[] = new Array(size).fill(null);
    const v: (number | null)[] = new Array(size).fill(null);
    const byKey = new Map(tiles.map((tile) => [tile.key, tile]));
    for (const row of rows) {
      const tile = byKey.get(row.tileKey)!;
      const rowOffset = Math.round((tile.latMin - grid.latMin) / grid.step);
      const colOffset = Math.round((tile.lonMin - grid.lonMin) / grid.step);
      for (let iLat = 0; iLat < tile.nLat; iLat++) {
        for (let iLon = 0; iLon < tile.nLon; iLon++) {
          const target = (rowOffset + iLat) * grid.nLon + colOffset + iLon;
          u[target] = row.u[iLat * tile.nLon + iLon]!;
          v[target] = row.v[iLat * tile.nLon + iLon]!;
        }
      }
    }

    const fetchedAt = new Date(Math.min(...rows.map((row) => row.fetchedAt.getTime())));
    return { grid, time: chosen, times, u, v, fetchedAt };
  }

  async prune(): Promise<void> {
    const cutoff = new Date(this.options.now().getTime() - FORECAST_RETENTION_MS);
    await this.db.getRepository(WindTileFrame).delete({ timeUtc: LessThan(cutoff) });
    await this.db.getRepository(WindTileFetch).delete({ fetchedAt: LessThan(cutoff) });
  }

  private ensureTile(tile: TileSpec): Promise<void> {
    const running = this.inFlight.get(tile.key);
    if (running !== undefined) {
      return running;
    }
    const refresh = this.refreshIfStale(tile).finally(() => this.inFlight.delete(tile.key));
    this.inFlight.set(tile.key, refresh);
    return refresh;
  }

  private async refreshIfStale(tile: TileSpec): Promise<void> {
    const now = this.options.now();
    if (await this.isFresh(tile, now)) {
      return;
    }
    const failedAt = this.lastFailure.get(tile.key);
    if (failedAt !== undefined && now.getTime() - failedAt < FAILURE_BACKOFF_MS) {
      return;
    }
    const points = tilePoints(tile);
    const calls = points.length * this.source.callsPerPoint;
    if ((await this.callsInLastDay(now)) + calls > this.options.dailyCallBudget) {
      return;
    }

    let frames;
    try {
      frames = await this.source.fetchGrid(points, FORECAST_DAYS);
    } catch (error) {
      this.lastFailure.set(tile.key, now.getTime());
      this.options.onError?.(tile.key, error);
      return;
    }
    this.lastFailure.delete(tile.key);

    const model = this.source.model;
    if (frames.length > 0) {
      await this.db.getRepository(WindTileFrame).upsert(
        frames.map((frame) => ({ ...frame, tileKey: tile.key, model, fetchedAt: now })),
        ['tileKey', 'timeUtc', 'heightM', 'model'],
      );
    }
    await this.db
      .getRepository(WindTileFetch)
      .insert({ tileKey: tile.key, model, calls, fetchedAt: now });
  }

  private async isFresh(tile: TileSpec, now: Date): Promise<boolean> {
    const since = new Date(now.getTime() - this.options.ttlMs);
    const recent = await this.db.getRepository(WindTileFetch).count({
      where: { tileKey: tile.key, model: this.source.model, fetchedAt: MoreThan(since) },
    });
    return recent > 0;
  }

  private async callsInLastDay(now: Date): Promise<number> {
    const result = await this.db
      .getRepository(WindTileFetch)
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.calls), 0)', 'total')
      .where('f.model = :model', { model: this.source.model })
      .andWhere('f.fetched_at > :since', { since: new Date(now.getTime() - DAY_MS) })
      .getRawOne<{ total: string | number }>();
    return Number(result?.total ?? 0);
  }
}
