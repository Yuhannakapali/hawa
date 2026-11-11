import type { PushToken } from './device-request';

export function registerServiceWorker(): void {}

// Native push needs @react-native-firebase/messaging, which needs the project's
// google-services.json and GoogleService-Info.plist before it can be installed.
export async function getPushToken(
  _webPushPublicKey: string | null,
): Promise<PushToken | null> {
  return null;
}
