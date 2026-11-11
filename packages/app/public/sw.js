const DEFAULT_URL = '/app';
const ICON = '/icons/icon-192.png';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  let message = { title: 'Hawa', body: '', url: DEFAULT_URL };
  if (event.data) {
    try {
      message = { ...message, ...event.data.json() };
    } catch {
      message.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      icon: ICON,
      data: { url: message.url },
    }),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL(
    event.notification.data?.url ?? DEFAULT_URL,
    self.location.origin,
  ).href;
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(windows => {
        const open = windows.find(w => w.url.startsWith(self.location.origin));
        if (open) {
          return open.navigate(url).then(w => (w ?? open).focus());
        }
        return self.clients.openWindow(url);
      }),
  );
});

// Chrome only offers "Install app" when the service worker handles fetch.
self.addEventListener('fetch', () => {});
