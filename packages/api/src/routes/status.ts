import type { FastifyInstance } from 'fastify';
import type { DataSource } from 'typeorm';
import { OPEN_METEO_CREDIT } from '../credit.js';
import { ForecastHour } from '../db/entities.js';

const STALE_AFTER_MS = 6 * 60 * 60 * 1000;

export interface StatusRoutesOptions {
  db: DataSource;
  model: string;
  now: () => Date;
}

export async function statusRoutes(app: FastifyInstance, { db, model, now }: StatusRoutesOptions) {
  app.get('/v1/status', async () => {
    const latest = await db
      .getRepository(ForecastHour)
      .createQueryBuilder('f')
      .select('MAX(f.fetched_at)', 'lastUpdatedAt')
      .where('f.model = :model', { model })
      .getRawOne<{ lastUpdatedAt: Date | null }>();

    const lastUpdatedAt = latest?.lastUpdatedAt ?? null;
    let stale = true;
    if (lastUpdatedAt !== null) {
      stale = now().getTime() - lastUpdatedAt.getTime() > STALE_AFTER_MS;
    }

    return {
      lastUpdatedAt: lastUpdatedAt?.toISOString() ?? null,
      stale,
      credit: OPEN_METEO_CREDIT,
    };
  });
}
