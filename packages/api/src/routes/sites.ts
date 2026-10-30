import type { PilotLevel } from '@hawa/scoring';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { And, In, LessThan, MoreThanOrEqual, type DataSource } from 'typeorm';
import { OPEN_METEO_CREDIT } from '../credit.js';
import { ForecastHour, Site } from '../db/entities.js';
import { buildDays, dailyRatingFor } from '../forecast/forecast-view.js';
import { FORECAST_DAYS } from '../forecast/refresh-forecasts.js';
import { addDays, nepalMidnightUtc, toNepalLocal } from '../time/nepal-time.js';

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;
const SITE_LIST_DAYS = 2;

const levelSchema = { type: 'string', enum: ['student', 'pilot'], default: 'student' } as const;
const idParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', format: 'uuid' } },
} as const;

export interface SiteRoutesOptions {
  db: DataSource;
  model: string;
  now: () => Date;
}

function sendNotFound(reply: FastifyReply) {
  return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'Site not found' });
}

export async function siteRoutes(app: FastifyInstance, { db, model, now }: SiteRoutesOptions) {
  const sites = db.getRepository(Site);
  const forecasts = db.getRepository(ForecastHour);

  function hoursBetween(siteIds: string[], fromDate: string, days: number) {
    return forecasts.find({
      where: {
        siteId: In(siteIds),
        model,
        timeUtc: And(
          MoreThanOrEqual(nepalMidnightUtc(fromDate)),
          LessThan(nepalMidnightUtc(addDays(fromDate, days))),
        ),
      },
    });
  }

  function findActiveSite(id: string) {
    return sites.findOneBy({ id, active: true });
  }

  app.get<{ Querystring: { level: PilotLevel; limit: number; offset: number } }>(
    '/v1/sites',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            level: levelSchema,
            limit: {
              type: 'integer',
              minimum: 1,
              maximum: MAX_PAGE_SIZE,
              default: DEFAULT_PAGE_SIZE,
            },
            offset: { type: 'integer', minimum: 0, default: 0 },
          },
        },
      },
    },
    async (request) => {
      const { level, limit, offset } = request.query;
      const [page, total] = await sites.findAndCount({
        where: { active: true },
        order: { name: 'ASC' },
        take: limit,
        skip: offset,
      });

      const today = toNepalLocal(now()).date;
      const tomorrow = addDays(today, 1);
      const rows = await hoursBetween(
        page.map((s) => s.id),
        today,
        SITE_LIST_DAYS,
      );

      const items = page.map((site) => {
        const siteRows = rows.filter((r) => r.siteId === site.id);
        return {
          id: site.id,
          name: site.name,
          lat: site.lat,
          lon: site.lon,
          launchAltM: site.launchAltM,
          minLevel: site.minLevel,
          today: dailyRatingFor(siteRows, level, today),
          tomorrow: dailyRatingFor(siteRows, level, tomorrow),
        };
      });
      return { items, total, limit, offset };
    },
  );

  app.get<{ Params: { id: string } }>(
    '/v1/sites/:id',
    { schema: { params: idParamsSchema } },
    async (request, reply) => {
      const site = await findActiveSite(request.params.id);
      if (site === null) {
        return sendNotFound(reply);
      }
      return {
        id: site.id,
        name: site.name,
        lat: site.lat,
        lon: site.lon,
        launchAltM: site.launchAltM,
        landingAltM: site.landingAltM,
        windSectors: site.windSectors,
        minLevel: site.minLevel,
        notes: site.notes,
        createdAt: site.createdAt.toISOString(),
        updatedAt: site.updatedAt.toISOString(),
      };
    },
  );

  app.get<{ Params: { id: string }; Querystring: { level: PilotLevel; days: number } }>(
    '/v1/sites/:id/forecast',
    {
      schema: {
        params: idParamsSchema,
        querystring: {
          type: 'object',
          properties: {
            level: levelSchema,
            days: { type: 'integer', minimum: 1, maximum: FORECAST_DAYS, default: FORECAST_DAYS },
          },
        },
      },
    },
    async (request, reply) => {
      const site = await findActiveSite(request.params.id);
      if (site === null) {
        return sendNotFound(reply);
      }
      const { level, days } = request.query;
      const today = toNepalLocal(now()).date;
      const rows = await hoursBetween([site.id], today, days);

      let fetchedAt: string | null = null;
      if (rows.length > 0) {
        const latest = Math.max(...rows.map((r) => r.fetchedAt.getTime()));
        fetchedAt = new Date(latest).toISOString();
      }

      return {
        siteId: site.id,
        level,
        model,
        fetchedAt,
        credit: OPEN_METEO_CREDIT,
        days: buildDays(rows, level, today, days),
      };
    },
  );
}
