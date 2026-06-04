import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/server/prisma';
import { generateDoseRecordsForToday, refreshMissed } from '../../../../lib/server/schedule';
import { sendDueDoseNotifications } from '../../../../lib/server/push';

const isAuthorized = (request: Request): boolean => {
  if (request.headers.get('x-vercel-cron') === '1') return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
};

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[cron/push] Starting...');

  // 1) Tüm kullanıcılar için bugünkü dozları oluştur
  const users = await prisma.user.findMany({ select: { id: true } });
  console.log(`[cron/push] Found ${users.length} users`);

  for (const user of users) {
    await generateDoseRecordsForToday(user.id);
    await refreshMissed(user.id);
  }

  // 2) Bildirimleri gönder
  const result = await sendDueDoseNotifications();
  console.log('[cron/push] Result:', JSON.stringify(result));

  return NextResponse.json({ users: users.length, ...result });
}
