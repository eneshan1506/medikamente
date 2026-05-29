import cron from 'node-cron';
import webpush from 'web-push';
import { DoseStatus } from '@prisma/client';
import { prisma } from '../infrastructure/prisma';

const vapidPublic = process.env.VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
}

const sendDueNotifications = async (): Promise<void> => {
  if (!vapidPublic || !vapidPrivate) return;
  try {
    const due = await prisma.doseRecord.findMany({
      where: {
        OR: [
          { status: DoseStatus.pending, scheduledAt: { lte: new Date() } },
          { status: DoseStatus.snoozed, snoozedUntil: { lte: new Date() } }
        ],
        notifiedAt: null
      },
      include: { medication: true, user: { include: { pushSubscriptions: true } } },
      take: 200
    });

    for (const dose of due) {
      for (const sub of dose.user.pushSubscriptions) {
        const payload = JSON.stringify({
          title: `İlaç zamanı: ${dose.medication.name}`,
          body: dose.medication.dosageText,
          doseId: dose.id,
          actions: [
            { action: 'taken', title: 'Aldım' },
            { action: 'snooze_10', title: '10 dk ertele' }
          ]
        });
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            },
            payload
          );
        } catch {
          await prisma.pushSubscription.deleteMany({ where: { id: sub.id } });
        }
      }

      await prisma.doseRecord.update({ where: { id: dose.id }, data: { notifiedAt: new Date(), status: dose.status === DoseStatus.pending ? DoseStatus.pending : DoseStatus.snoozed } });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('push-scheduler-error', error);
  }
};

export const startScheduler = (): void => {
  cron.schedule('*/1 * * * *', () => {
    void sendDueNotifications();
  });
};
