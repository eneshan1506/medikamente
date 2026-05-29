import { NextResponse } from 'next/server';
import { getUserIdFromSession } from '../../../../lib/server/auth';
import { prisma } from '../../../../lib/server/prisma';
import { timezoneSchema } from '../../../../lib/server/validation';

export async function POST(request: Request) {
  const userId = getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const input = timezoneSchema.parse(await request.json());
  const user = await prisma.user.update({
    where: { id: userId },
    data: { timeZone: input.timeZone },
    select: { id: true, email: true, timeZone: true }
  });
  return NextResponse.json(user);
}
