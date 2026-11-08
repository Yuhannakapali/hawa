const DEFAULT_PORT = 3000;
const DEFAULT_HOST = '0.0.0.0';
// Leaves room under Open-Meteo's 10,000 free calls a day for the hourly site forecasts.
const DEFAULT_WIND_DAILY_CALL_BUDGET = 7000;
const DEFAULT_OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

export interface AppConfig {
  databaseUrl: string;
  host: string;
  port: number;
  openMeteoUrl: string;
  windDailyCallBudget: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const databaseUrl = env['DATABASE_URL'];
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
  return {
    databaseUrl,
    host: env['HOST'] ?? DEFAULT_HOST,
    port: Number(env['PORT'] ?? DEFAULT_PORT),
    openMeteoUrl: env['OPEN_METEO_URL'] ?? DEFAULT_OPEN_METEO_URL,
    windDailyCallBudget: Number(env['WIND_DAILY_CALL_BUDGET'] ?? DEFAULT_WIND_DAILY_CALL_BUDGET),
  };
}
