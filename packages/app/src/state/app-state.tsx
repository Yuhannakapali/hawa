import type { PilotLevel } from '@hawa/contracts';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AltitudeUnit, SpeedUnit } from '../format/units';
import { readJson, writeJson } from '../storage/kv-store';

export type ThemePref = 'system' | 'light' | 'dark';

export const ALERT_TIMES = ['18:00', '19:00', '20:00', '21:00'] as const;
export type AlertTime = (typeof ALERT_TIMES)[number];

export interface Settings {
  onboarded: boolean;
  level: PilotLevel;
  speedUnit: SpeedUnit;
  altitudeUnit: AltitudeUnit;
  themePref: ThemePref;
  eveningAlert: boolean;
  alertTime: AlertTime;
}

export interface Favorite {
  alertsOn: boolean;
}

export type Favorites = Record<string, Favorite>;

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  level: 'student',
  speedUnit: 'kmh',
  altitudeUnit: 'm',
  themePref: 'system',
  eveningAlert: false,
  alertTime: '19:00',
};

const SETTINGS_KEY = 'settings';
const FAVORITES_KEY = 'favorites';

interface AppState {
  ready: boolean;
  settings: Settings;
  favorites: Favorites;
  updateSettings: (patch: Partial<Settings>) => void;
  toggleFavorite: (siteId: string) => void;
  setSiteAlert: (siteId: string, alertsOn: boolean) => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [favorites, setFavorites] = useState<Favorites>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      readJson<Partial<Settings>>(SETTINGS_KEY),
      readJson<Favorites>(FAVORITES_KEY),
    ]).then(([storedSettings, storedFavorites]) => {
      if (cancelled) {
        return;
      }
      setSettings({ ...DEFAULT_SETTINGS, ...storedSettings });
      setFavorites(storedFavorites ?? {});
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      writeJson(SETTINGS_KEY, next);
      return next;
    });
  }, []);

  const saveFavorites = useCallback((update: (current: Favorites) => Favorites) => {
    setFavorites((current) => {
      const next = update(current);
      writeJson(FAVORITES_KEY, next);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(
    (siteId: string) =>
      saveFavorites((current) => {
        if (current[siteId]) {
          const { [siteId]: _removed, ...rest } = current;
          return rest;
        }
        return { ...current, [siteId]: { alertsOn: true } };
      }),
    [saveFavorites],
  );

  const setSiteAlert = useCallback(
    (siteId: string, alertsOn: boolean) =>
      saveFavorites((current) => ({ ...current, [siteId]: { alertsOn } })),
    [saveFavorites],
  );

  const value = useMemo(
    () => ({
      ready,
      settings,
      favorites,
      updateSettings,
      toggleFavorite,
      setSiteAlert,
    }),
    [ready, settings, favorites, updateSettings, toggleFavorite, setSiteAlert],
  );
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const state = useContext(AppStateContext);
  if (state === null) {
    throw new Error('useAppState must be used inside AppStateProvider');
  }
  return state;
}
