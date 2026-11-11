/// <reference lib="dom" />
import type { PushToken } from './device-request';

const SERVICE_WORKER_URL = '/sw.js';

function base64UrlToBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  navigator.serviceWorker.register(SERVICE_WORKER_URL).catch(() => {
    // The site still works without a service worker; only install and alerts are lost.
  });
}

/** Subscribes this browser to web push. Null when the browser can't, or permission isn't granted. */
export async function getPushToken(
  webPushPublicKey: string | null,
): Promise<PushToken | null> {
  if (
    webPushPublicKey === null ||
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    typeof Notification === 'undefined' ||
    Notification.permission !== 'granted'
  ) {
    return null;
  }
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (subscription === null) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(webPushPublicKey),
    });
  }
  return { platform: 'web', token: JSON.stringify(subscription) };
}
