import type { PilotLevel } from '@hawa/contracts';
import { useCallback } from 'react';
import { api } from '../api/instance';
import { loadWithCache } from '../state/forecast-cache';
import { useRequest } from './use-request';

const MAX_SITES = 100;

export function useSites(level: PilotLevel) {
  const load = useCallback(
    () =>
      loadWithCache(`sites:${level}`, () => api.listSites({ level, limit: MAX_SITES }), {
        save: true,
      }),
    [level],
  );
  return useRequest(load);
}

export function useSite(id: string) {
  const load = useCallback(
    () => loadWithCache(`site:${id}`, () => api.getSite(id), { save: true }),
    [id],
  );
  return useRequest(load);
}

export function useForecast(id: string, level: PilotLevel, isFavorite: boolean) {
  const load = useCallback(
    () =>
      loadWithCache(`forecast:${id}:${level}`, () => api.getForecast(id, { level }), {
        save: isFavorite,
      }),
    [id, level, isFavorite],
  );
  return useRequest(load);
}

export function useStatus() {
  const load = useCallback(() => api.getStatus(), []);
  return useRequest(load);
}

export function useWindGrid(enabled: boolean, height: number, time: string | undefined) {
  const load = useCallback(async () => {
    if (!enabled) {
      return null;
    }
    return api.getWindGrid({ height, time });
  }, [enabled, height, time]);
  return useRequest(load);
}
