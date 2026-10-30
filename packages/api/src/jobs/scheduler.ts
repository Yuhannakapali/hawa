import type { FastifyBaseLogger } from 'fastify';
import type { DataSource } from 'typeorm';
import { pruneForecasts, refreshForecasts } from '../forecast/refresh-forecasts.js';
import { pruneWindGrid, refreshWindGrid } from '../forecast/refresh-wind-grid.js';
import type { WeatherSource } from '../weather/types.js';
import type { WindGridSource } from '../weather/wind-grid.js';

const HOUR_MS = 60 * 60 * 1000;
const REFRESH_INTERVAL_MS = HOUR_MS;
const WIND_GRID_INTERVAL_MS = 3 * HOUR_MS;
const PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function scheduleJobs(
  db: DataSource,
  source: WeatherSource,
  gridSource: WindGridSource,
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

  async function refreshGrid() {
    try {
      const frames = await refreshWindGrid(db, gridSource, new Date());
      log.info({ frames }, 'wind grid refresh finished');
    } catch (error) {
      log.error(error, 'wind grid refresh failed');
    }
  }

  async function prune() {
    try {
      const now = new Date();
      const deleted = await pruneForecasts(db, now);
      const deletedFrames = await pruneWindGrid(db, now);
      log.info({ deleted, deletedFrames }, 'old forecast hours pruned');
    } catch (error) {
      log.error(error, 'forecast prune failed');
    }
  }

  void refresh();
  void refreshGrid();
  const timers = [
    setInterval(refresh, REFRESH_INTERVAL_MS),
    setInterval(refreshGrid, WIND_GRID_INTERVAL_MS),
    setInterval(prune, PRUNE_INTERVAL_MS),
  ];
  return () => timers.forEach(clearInterval);
}
