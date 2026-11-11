import type { DevicePlatform, DeviceRequest } from '@hawa/contracts';
import type { Favorites, Settings } from '../state/app-state';

export interface PushToken {
  platform: DevicePlatform;
  token: string;
}

/** What the backend needs to send this device its evening alert, or null when alerts are off. */
export function buildDeviceRequest(
  settings: Settings,
  favorites: Favorites,
  pushToken: PushToken | null,
): DeviceRequest | null {
  if (!settings.eveningAlert || pushToken === null) {
    return null;
  }
  return {
    platform: pushToken.platform,
    token: pushToken.token,
    level: settings.level,
    alertTime: settings.alertTime,
    alertSiteIds: Object.keys(favorites).filter(id => favorites[id]!.alertsOn),
  };
}
