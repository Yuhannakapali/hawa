const DEFAULT_PORT = 3000;
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

export interface AppConfig {
  databaseUrl: string;
  host: string;
  port: number;
  openMeteoUrl: string;
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
  };
}
