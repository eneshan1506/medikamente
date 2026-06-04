import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/server/prisma';
import { generateDoseRecordsForToday, refreshMissed } from '../../../../lib/server/schedule';
import { sendDueDoseNotifications } from '../../../../lib/server/push';

const isAuthorized = (request: Request): boolean => {
  if (request.headers.get('x-vercel-cron') === '1') {
    console.log('[cron/push] Authorized via Vercel system cron header.');
    return true;
  }
  
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!secret) {
    console.error('[cron/push] Authorization failed: CRON_SECRET environment variable is missing on Vercel!');
    return false;
  }

  const expectedHeader = `Bearer ${secret}`;
  const matches = authHeader === expectedHeader;

  if (!matches) {
    console.error('[cron/push] Authorization failed: Header mismatch.', {
      receivedHeaderExists: !!authHeader,
      receivedHeaderLength: authHeader?.length || 0,
      receivedHeaderStart: authHeader ? authHeader.substring(0, 15) + '...' : 'none',
      expectedSecretLength: secret.length
    });
  } else {
    console.log('[cron/push] Authorized via custom Authorization header.');
  }

  return matches;
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
