import Fastify, { type FastifyInstance } from 'fastify';
import type { DataSource } from 'typeorm';
import { siteRoutes } from './routes/sites.js';
import { statusRoutes } from './routes/status.js';

export interface AppDeps {
  db: DataSource;
  model: string;
  now?: () => Date;
  logger?: boolean;
}

export function buildApp({
  db,
  model,
  now = () => new Date(),
  logger = false,
}: AppDeps): FastifyInstance {
  const app = Fastify({ logger });
  app.register(siteRoutes, { db, model, now });
  app.register(statusRoutes, { db, model, now });
  return app;
}
