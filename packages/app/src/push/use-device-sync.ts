import { useEffect } from 'react';
import { api } from '../api/instance';
import { useAppState } from '../state/app-state';
import { readJson, writeJson } from '../storage/kv-store';
import { buildDeviceRequest } from './device-request';
import { getPushToken } from './push-token';

const DEVICE_ID_KEY = 'deviceId';
const UUID_BYTES = 16;
const UUID_VERSION_BYTE = 6;
const UUID_VARIANT_BYTE = 8;

function randomUuid(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(UUID_BYTES));
  bytes[UUID_VERSION_BYTE] = (bytes[UUID_VERSION_BYTE]! & 0x0f) | 0x40;
  bytes[UUID_VARIANT_BYTE] = (bytes[UUID_VARIANT_BYTE]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16,
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function deviceId(): Promise<string> {
  const stored = await readJson<string>(DEVICE_ID_KEY);
  if (stored !== null) {
    return stored;
  }
  const created = randomUuid();
  await writeJson(DEVICE_ID_KEY, created);
  return created;
}

/** Keeps the backend's copy of this device's alert settings in step with the app. */
export function useDeviceSync(): void {
  const { ready, settings, favorites } = useAppState();

  useEffect(() => {
    if (!ready) {
      return;
    }
    let cancelled = false;
    async function sync() {
      if (!settings.eveningAlert) {
        const registeredId = await readJson<string>(DEVICE_ID_KEY);
        if (registeredId !== null) {
          await api.deleteDevice(registeredId);
        }
        return;
      }
      const id = await deviceId();
      const { webPushPublicKey } = await api.getPushConfig();
      const request = buildDeviceRequest(
        settings,
        favorites,
        await getPushToken(webPushPublicKey),
      );
      if (cancelled || request === null) {
        return;
      }
      await api.putDevice(id, request);
    }
    sync().catch(() => {
      // Offline or server down: the next change or app start tries again.
    });
    return () => {
      cancelled = true;
    };
  }, [ready, settings, favorites]);
}
