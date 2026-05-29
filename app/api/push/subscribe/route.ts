import { NextResponse } from 'next/server';
import { getUserIdFromSession } from '../../../../lib/server/auth';
import { prisma } from '../../../../lib/server/prisma';
import { pushSchema } from '../../../../lib/server/validation';

export async function POST(request: Request) {
  const userId = getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = pushSchema.parse(await request.json());
  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: { userId, p256dh: body.keys.p256dh, auth: body.keys.auth },
    create: { userId, endpoint: body.endpoint, p256dh: body.keys.p256dh, auth: body.keys.auth }
  });

  return new NextResponse(null, { status: 204 });
}
