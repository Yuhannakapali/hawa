import { cert, initializeApp } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { readFileSync } from 'node:fs';
import type { PushChannel, PushMessage, PushResult } from './push-sender.js';

const GONE_ERROR_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);
const FIREBASE_APP_NAME = 'hawa-push';

function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String(error.code);
  }
  return undefined;
}

/** Firebase Cloud Messaging; it reaches iOS through the APNs key set in the Firebase console. */
export class FcmChannel implements PushChannel {
  private readonly messaging: Messaging;

  constructor(serviceAccountFile: string) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountFile, 'utf8'));
    const app = initializeApp({ credential: cert(serviceAccount) }, FIREBASE_APP_NAME);
    this.messaging = getMessaging(app);
  }

  async send(token: string, message: PushMessage): Promise<PushResult> {
    try {
      await this.messaging.send({
        token,
        notification: { title: message.title, body: message.body },
        data: { url: message.url },
      });
      return 'sent';
    } catch (error) {
      const code = errorCode(error);
      if (code !== undefined && GONE_ERROR_CODES.has(code)) {
        return 'gone';
      }
      throw error;
    }
  }
}
