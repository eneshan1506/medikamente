self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = payload.title || 'Medikamente';
  const options = {
    body: payload.body || 'Bildirim',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: { doseId: payload.doseId || null },
    actions: [
      { action: 'taken', title: 'Aldim' },
      { action: 'snooze_10', title: '10 dk ertele' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action || 'open';
  const doseId = event.notification.data?.doseId || null;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        client.postMessage({ action, doseId });
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
