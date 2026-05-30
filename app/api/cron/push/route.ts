import { NextResponse } from 'next/server';
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

  const result = await sendDueDoseNotifications();
  return NextResponse.json(result);
}
