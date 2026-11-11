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
  /** Null when VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT are not all set. */
  webPush: { publicKey: string; privateKey: string; subject: string } | null;
  /** Path to the Firebase service account JSON, or null when native push is off. */
  firebaseServiceAccountFile: string | null;
}

function webPushConfig(env: NodeJS.ProcessEnv): AppConfig['webPush'] {
  const publicKey = env['VAPID_PUBLIC_KEY'];
  const privateKey = env['VAPID_PRIVATE_KEY'];
  const subject = env['VAPID_SUBJECT'];
  if (!publicKey || !privateKey || !subject) {
    return null;
  }
  return { publicKey, privateKey, subject };
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
    webPush: webPushConfig(env),
    firebaseServiceAccountFile: env['FIREBASE_SERVICE_ACCOUNT_FILE'] || null,
  };
}
