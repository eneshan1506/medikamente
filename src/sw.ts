/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<unknown> };

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener('push', (event) => {
  const payload = event.data?.json() as
    | { title?: string; body?: string; doseId?: string; actions?: Array<{ action: string; title: string }> }
    | undefined;

  const title = payload?.title ?? 'İlaç hatırlatma';
  const body = payload?.body ?? 'Doz zamanın geldi.';
  const doseId = payload?.doseId;

  const options: NotificationOptions & { actions: Array<{ action: string; title: string }> } = {
      body,
      data: { doseId },
      tag: doseId,
      requireInteraction: true,
      actions: payload?.actions ?? [
        { action: 'taken', title: 'Aldım' },
        { action: 'snooze_10', title: '10 dk ertele' }
      ]
    };
  event.waitUntil(self.registration.showNotification(title, options as NotificationOptions));
});

self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data as { doseId?: string } | undefined;
  event.notification.close();

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
      const client = clients[0] ?? (await self.clients.openWindow('/'));
      if (client && data?.doseId) {
        client.postMessage({ action: event.action || 'open', doseId: data.doseId });
      }
    })()
  );
});
