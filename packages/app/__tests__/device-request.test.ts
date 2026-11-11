import { buildDeviceRequest } from '../src/push/device-request';
import { DEFAULT_SETTINGS } from '../src/state/app-state';

const WEB_TOKEN = {
  platform: 'web' as const,
  token: '{"endpoint":"https://push.example/abc"}',
};

describe('buildDeviceRequest', () => {
  it('sends only favorites with alerts on, with the level and alert time', () => {
    const request = buildDeviceRequest(
      {
        ...DEFAULT_SETTINGS,
        eveningAlert: true,
        level: 'pilot',
        alertTime: '20:00',
      },
      { a: { alertsOn: true }, b: { alertsOn: false }, c: { alertsOn: true } },
      WEB_TOKEN,
    );

    expect(request).toEqual({
      platform: 'web',
      token: WEB_TOKEN.token,
      level: 'pilot',
      alertTime: '20:00',
      alertSiteIds: ['a', 'c'],
    });
  });

  it('returns null when the evening alert is off', () => {
    const request = buildDeviceRequest(
      { ...DEFAULT_SETTINGS, eveningAlert: false },
      { a: { alertsOn: true } },
      WEB_TOKEN,
    );
    expect(request).toBeNull();
  });

  it('returns null when there is no push token', () => {
    const request = buildDeviceRequest(
      { ...DEFAULT_SETTINGS, eveningAlert: true },
      { a: { alertsOn: true } },
      null,
    );
    expect(request).toBeNull();
  });
});
