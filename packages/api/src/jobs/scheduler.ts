import type { FastifyBaseLogger } from 'fastify';
import type { DataSource } from 'typeorm';
import { pruneForecasts, refreshForecasts } from '../forecast/refresh-forecasts.js';
import type { WeatherSource } from '../weather/types.js';

const REFRESH_INTERVAL_MS = 60 * 60 * 1000;
const PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function scheduleJobs(
  db: DataSource,
  source: WeatherSource,
  log: FastifyBaseLogger,
): () => void {
  async function refresh() {
    try {
      const result = await refreshForecasts(db, source, new Date());
      log.info({ updatedSites: result.updatedSites }, 'forecast refresh finished');
      for (const failure of result.failures) {
        log.warn(failure, 'forecast refresh failed for site');
      }
    } catch (error) {
      log.error(error, 'forecast refresh failed');
    }
  }

  async function prune() {
    try {
      const deleted = await pruneForecasts(db, new Date());
      log.info({ deleted }, 'old forecast hours pruned');
    } catch (error) {
      log.error(error, 'forecast prune failed');
    }
  }

  void refresh();
  const timers = [setInterval(refresh, REFRESH_INTERVAL_MS), setInterval(prune, PRUNE_INTERVAL_MS)];
  return () => timers.forEach(clearInterval);
}
