import type { WindGridResponse } from '@hawa/contracts';
import type { FastifyInstance } from 'fastify';
import type { DataSource } from 'typeorm';
import { OPEN_METEO_CREDIT } from '../credit.js';
import { WindGridFrame } from '../db/entities.js';
import { SURFACE_HEIGHT_M, WIND_GRID, WIND_GRID_HEIGHTS_M } from '../weather/wind-grid.js';

const DECIMALS_FACTOR = 10;

export interface WindGridRoutesOptions {
  db: DataSource;
  model: string;
  now: () => Date;
}

function round(values: number[]): number[] {
  return values.map((value) => Math.round(value * DECIMALS_FACTOR) / DECIMALS_FACTOR);
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

export async function windGridRoutes(
  app: FastifyInstance,
  { db, model, now }: WindGridRoutesOptions,
) {
  const frames = db.getRepository(WindGridFrame);

  app.get<{ Querystring: { height: number; time?: string } }>(
    '/v1/wind-grid',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            height: { type: 'integer', enum: [...WIND_GRID_HEIGHTS_M], default: SURFACE_HEIGHT_M },
            time: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    async (request, reply) => {
      const { height, time } = request.query;
      const available = await frames.find({
        select: { timeUtc: true },
        where: { heightM: height, model },
        order: { timeUtc: 'ASC' },
      });
      if (available.length === 0) {
        return reply
          .code(404)
          .send({ statusCode: 404, error: 'Not Found', message: 'No wind grid yet' });
      }

      let target = now();
      if (time !== undefined) {
        target = new Date(time);
      }
      const times = available.map((frame) => frame.timeUtc);
      const chosen = nearest(times, target);
      const frame = await frames.findOneByOrFail({ timeUtc: chosen, heightM: height, model });

      const response: WindGridResponse = {
        heightM: height,
        time: chosen.toISOString(),
        times: times.map((t) => t.toISOString()),
        grid: WIND_GRID,
        u: round(frame.u),
        v: round(frame.v),
        fetchedAt: frame.fetchedAt.toISOString(),
        credit: OPEN_METEO_CREDIT,
      };
      return response;
    },
  );
}
