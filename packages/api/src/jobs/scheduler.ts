import type { FastifyBaseLogger } from 'fastify';
import type { DataSource } from 'typeorm';
import { sendEveningAlerts } from '../alerts/evening-alerts.js';
import { pruneForecasts, refreshForecasts } from '../forecast/refresh-forecasts.js';
import type { PushSender } from '../push/push-sender.js';
import type { WindTileCache } from '../forecast/wind-tile-cache.js';
import type { WeatherSource } from '../weather/types.js';
import { PREFETCH_TILES } from '../weather/wind-tiles.js';

const HOUR_MS = 60 * 60 * 1000;
const REFRESH_INTERVAL_MS = HOUR_MS;
const WIND_PREFETCH_INTERVAL_MS = 3 * HOUR_MS;
const PRUNE_INTERVAL_MS = 24 * 60 * 60 * 1000;
const ALERT_INTERVAL_MS = 15 * 60 * 1000;

export function scheduleJobs(
  db: DataSource,
  source: WeatherSource,
  windTiles: WindTileCache,
  pushSender: PushSender,
  log: FastifyBaseLogger,
): () => void {
  async function alert() {
    try {
      const result = await sendEveningAlerts(db, pushSender, source.model, new Date());
      if (result.sent + result.removed + result.failed > 0) {
        log.info(result, 'evening alerts sent');
      }
    } catch (error) {
      log.error(error, 'evening alerts failed');
    }
  }

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
      await windTiles.ensure(PREFETCH_TILES);
      log.info({ tiles: PREFETCH_TILES.length }, 'wind tile prefetch finished');
    } catch (error) {
      log.error(error, 'wind tile prefetch failed');
    }
  }

  async function prune() {
    try {
      const now = new Date();
      const deleted = await pruneForecasts(db, now);
      await windTiles.prune();
      log.info({ deleted }, 'old forecast hours and wind tiles pruned');
    } catch (error) {
      log.error(error, 'forecast prune failed');
    }
  }

  void refresh();
  void refreshGrid();
  const timers = [
    setInterval(refresh, REFRESH_INTERVAL_MS),
    setInterval(refreshGrid, WIND_PREFETCH_INTERVAL_MS),
    setInterval(prune, PRUNE_INTERVAL_MS),
    setInterval(alert, ALERT_INTERVAL_MS),
  ];
  return () => timers.forEach(clearInterval);
}
