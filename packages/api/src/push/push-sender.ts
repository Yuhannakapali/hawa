import type { DevicePlatform } from '@hawa/contracts';

export interface PushMessage {
  title: string;
  body: string;
  /** App path to open when the notification is tapped. */
  url: string;
}

/** "gone" means the token will never work again and the device should be forgotten. */
export type PushResult = 'sent' | 'gone';

export interface PushSender {
  send(platform: DevicePlatform, token: string, message: PushMessage): Promise<PushResult>;
}

/** Delivers to one push service. Swap a provider by writing another channel. */
export interface PushChannel {
  send(token: string, message: PushMessage): Promise<PushResult>;
}

export class PushNotConfiguredError extends Error {
  constructor(platform: DevicePlatform) {
    super(`No push channel is configured for ${platform}`);
    this.name = 'PushNotConfiguredError';
  }
}

export function createPushSender(
  channels: Partial<Record<DevicePlatform, PushChannel>>,
): PushSender {
  return {
    send(platform, token, message) {
      const channel = channels[platform];
      if (channel === undefined) {
        return Promise.reject(new PushNotConfiguredError(platform));
      }
      return channel.send(token, message);
    },
  };
}
