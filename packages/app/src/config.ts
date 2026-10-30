import { Platform } from 'react-native';

// The web build is served from the same origin as the API (Vite proxies /v1 in development).
const NATIVE_DEV_API_URL = 'http://localhost:3000';

export function apiBaseUrl(): string {
  if (Platform.OS === 'web') {
    return '';
  }
  return NATIVE_DEV_API_URL;
}
