import Fastify, { type FastifyInstance } from 'fastify';
import type { DataSource } from 'typeorm';
import type { WindTileCache } from './forecast/wind-tile-cache.js';
import { deviceRoutes } from './routes/devices.js';
import { siteRoutes } from './routes/sites.js';
import { statusRoutes } from './routes/status.js';
import { windGridRoutes } from './routes/wind-grid.js';

export interface AppDeps {
  db: DataSource;
  model: string;
  now?: () => Date;
  logger?: boolean;
  windTiles?: WindTileCache;
  webPushPublicKey?: string | null;
}

export function buildApp({
  db,
  model,
  now = () => new Date(),
  logger = false,
  windTiles,
  webPushPublicKey = null,
}: AppDeps): FastifyInstance {
  const app = Fastify({ logger });
  app.register(siteRoutes, { db, model, now });
  app.register(statusRoutes, { db, model, now });
  app.register(deviceRoutes, { db, webPushPublicKey });
  if (windTiles !== undefined) {
    app.register(windGridRoutes, { windTiles });
  }
  return app;
}
