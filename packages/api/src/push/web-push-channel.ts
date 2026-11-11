import webPush, { type PushSubscription } from 'web-push';
import type { PushChannel, PushMessage, PushResult } from './push-sender.js';

const GONE_STATUS_CODES = new Set([404, 410]);

export interface WebPushKeys {
  publicKey: string;
  privateKey: string;
  /** A mailto: or https: contact for the push service operator. */
  subject: string;
}

export class WebPushChannel implements PushChannel {
  constructor(private readonly keys: WebPushKeys) {}

  async send(token: string, message: PushMessage): Promise<PushResult> {
    const subscription = JSON.parse(token) as PushSubscription;
    try {
      await webPush.sendNotification(subscription, JSON.stringify(message), {
        vapidDetails: this.keys,
      });
      return 'sent';
    } catch (error) {
      if (error instanceof webPush.WebPushError && GONE_STATUS_CODES.has(error.statusCode)) {
        return 'gone';
      }
      throw error;
    }
  }
}
