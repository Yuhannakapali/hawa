import { LessThan, type DataSource } from 'typeorm';
import { WindGridFrame } from '../db/entities.js';
import { gridPoints, type WindGridSource } from '../weather/wind-grid.js';
import { FORECAST_DAYS, FORECAST_RETENTION_MS } from './refresh-forecasts.js';

export async function refreshWindGrid(
  db: DataSource,
  source: WindGridSource,
  now: Date,
): Promise<number> {
  const frames = await source.fetchGrid(gridPoints(), FORECAST_DAYS);
  if (frames.length === 0) {
    return 0;
  }
  await db.getRepository(WindGridFrame).upsert(
    frames.map((frame) => ({ ...frame, model: source.model, fetchedAt: now })),
    ['timeUtc', 'heightM', 'model'],
  );
  return frames.length;
}

export async function pruneWindGrid(db: DataSource, now: Date): Promise<number> {
  const cutoff = new Date(now.getTime() - FORECAST_RETENTION_MS);
  const result = await db.getRepository(WindGridFrame).delete({ timeUtc: LessThan(cutoff) });
  return result.affected ?? 0;
}
