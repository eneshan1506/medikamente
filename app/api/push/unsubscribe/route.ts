import { NextResponse } from 'next/server';
import { getUserIdFromSession } from '../../../../lib/server/auth';
import { prisma } from '../../../../lib/server/prisma';

export async function POST(request: Request) {
  const userId = getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as { endpoint?: string };
  if (!body.endpoint) return NextResponse.json({ error: 'endpoint missing' }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { userId, endpoint: body.endpoint } });
  return new NextResponse(null, { status: 204 });
}
