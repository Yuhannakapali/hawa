import Fastify, { type FastifyInstance } from 'fastify';
import type { DataSource } from 'typeorm';
import type { WindTileCache } from './forecast/wind-tile-cache.js';
import { siteRoutes } from './routes/sites.js';
import { statusRoutes } from './routes/status.js';
import { windGridRoutes } from './routes/wind-grid.js';

export interface AppDeps {
  db: DataSource;
  model: string;
  now?: () => Date;
  logger?: boolean;
  windTiles?: WindTileCache;
}

export function buildApp({
  db,
  model,
  now = () => new Date(),
  logger = false,
  windTiles,
}: AppDeps): FastifyInstance {
  const app = Fastify({ logger });
  app.register(siteRoutes, { db, model, now });
  app.register(statusRoutes, { db, model, now });
  if (windTiles !== undefined) {
    app.register(windGridRoutes, { windTiles });
  }
  return app;
}
