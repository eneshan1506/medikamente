import webpush from 'web-push';
import { prisma } from './prisma';

const REPEAT_INTERVAL_MS = 10 * 60 * 1000;

let vapidConfigured = false;

const ensureVapidConfigured = (): boolean => {
  if (vapidConfigured) return true;
  const subject = process.env.VAPID_SUBJECT;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) {
    console.error('[push] VAPID not configured:', { subject: !!subject, publicKey: !!publicKey, privateKey: !!privateKey });
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
};

const shouldNotify = (now: Date, dueAt: Date, notifiedAt: Date | null): boolean => {
  if (dueAt.getTime() > now.getTime()) return false;
  if (!notifiedAt) return true;
  return now.getTime() - notifiedAt.getTime() >= REPEAT_INTERVAL_MS;
};

export const sendDueDoseNotifications = async (): Promise<{ sent: number; failed: number; skipped: number }> => {
  if (!ensureVapidConfigured()) {
    console.error('[push] Aborting: VAPID not configured');
    return { sent: 0, failed: 0, skipped: 0 };
  }

  const now = new Date();
  const due = await prisma.doseRecord.findMany({
    where: {
      status: { in: ['pending', 'snoozed', 'missed'] }
    },
    include: {
      medication: { select: { name: true, dosageText: true } },
      user: { select: { id: true } }
    },
    orderBy: { scheduledAt: 'asc' },
    take: 200
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const dose of due) {
    const dueAt = dose.snoozedUntil ?? dose.scheduledAt;
    if (!shouldNotify(now, dueAt, dose.notifiedAt)) {
      skipped += 1;
      continue;
    }

    const subs = await prisma.pushSubscription.findMany({ where: { userId: dose.userId } });
    if (subs.length === 0) {
      console.log(`[push] No subscriptions for user ${dose.userId}, skipping dose ${dose.id}`);
      skipped += 1;
      continue;
    }

    const payload = JSON.stringify({
      title: `Ilac zamani: ${dose.medication.name}`,
      body: `${dose.medication.dosageText} dozunu almayi unutma.`,
      doseId: dose.id
    });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          payload
        );
        sent += 1;
      } catch (err) {
        console.error(`[push] Failed to send to ${sub.endpoint}:`, err);
        failed += 1;
        await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint, userId: dose.userId } });
      }
    }

    await prisma.doseRecord.update({ where: { id: dose.id }, data: { notifiedAt: now } });
  }

  return { sent, failed, skipped };
};
