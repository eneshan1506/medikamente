import { DateTime } from 'luxon';
import { NextResponse } from 'next/server';
import { getUserIdFromSession } from '../../../../lib/server/auth';
import { prisma } from '../../../../lib/server/prisma';
import { generateDoseRecordsForToday, refreshMissed } from '../../../../lib/server/schedule';

export async function GET() {
  const userId = getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  await generateDoseRecordsForToday(user.id);
  await refreshMissed(user.id);

  const start = DateTime.now().setZone(user.timeZone).startOf('day').toUTC().toJSDate();
  const end = DateTime.now().setZone(user.timeZone).endOf('day').toUTC().toJSDate();

  const records = await prisma.doseRecord.findMany({
    where: { userId: user.id, scheduledAt: { gte: start, lte: end } },
    include: { medication: true },
    orderBy: { scheduledAt: 'asc' }
  });

  return NextResponse.json(records);
}
