import type { WindGridResponse } from '@hawa/contracts';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { OPEN_METEO_CREDIT } from '../credit.js';
import type { WindTileCache } from '../forecast/wind-tile-cache.js';
import { SURFACE_HEIGHT_M, WIND_GRID_HEIGHTS_M } from '../weather/wind-grid.js';
import { tilesForView, type Bbox } from '../weather/wind-tiles.js';

const DECIMALS_FACTOR = 10;
const MAX_ZOOM = 22;
const NUMBER = '-?\\d+(\\.\\d+)?';
const BBOX_PATTERN = `^${NUMBER},${NUMBER},${NUMBER},${NUMBER}$`;

export interface WindGridRoutesOptions {
  windTiles: WindTileCache;
}

function round(values: (number | null)[]): (number | null)[] {
  return values.map((value) => {
    if (value === null) {
      return null;
    }
    return Math.round(value * DECIMALS_FACTOR) / DECIMALS_FACTOR;
  });
}

function parseBbox(raw: string): Bbox | null {
  const [west, south, east, north] = raw.split(',').map(Number) as [number, number, number, number];
  if (west >= east || south >= north) {
    return null;
  }
  return { west, south, east, north };
}

function notFound(reply: FastifyReply, message: string) {
  return reply.code(404).send({ statusCode: 404, error: 'Not Found', message });
}

export async function windGridRoutes(app: FastifyInstance, { windTiles }: WindGridRoutesOptions) {
  app.get<{ Querystring: { bbox: string; zoom: number; height: number; time?: string } }>(
    '/v1/wind-grid',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['bbox', 'zoom'],
          properties: {
            bbox: { type: 'string', pattern: BBOX_PATTERN },
            zoom: { type: 'number', minimum: 0, maximum: MAX_ZOOM },
            height: { type: 'integer', enum: [...WIND_GRID_HEIGHTS_M], default: SURFACE_HEIGHT_M },
            time: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    async (request, reply) => {
      const { bbox, zoom, height, time } = request.query;
      const view = parseBbox(bbox);
      if (view === null) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'bbox must be west,south,east,north with west < east and south < north',
        });
      }
      const tiles = tilesForView(view, zoom);
      if (tiles.length === 0) {
        return notFound(reply, 'No wind data for this area');
      }

      await windTiles.ensure(tiles);
      let target: Date | undefined;
      if (time !== undefined) {
        target = new Date(time);
      }
      const frame = await windTiles.frame(tiles, height, target);
      if (frame === null) {
        return notFound(reply, 'No wind data yet');
      }

      const response: WindGridResponse = {
        heightM: height,
        time: frame.time.toISOString(),
        times: frame.times.map((t) => t.toISOString()),
        grid: frame.grid,
        u: round(frame.u),
        v: round(frame.v),
        fetchedAt: frame.fetchedAt.toISOString(),
        credit: OPEN_METEO_CREDIT,
      };
      return response;
    },
  );
}
