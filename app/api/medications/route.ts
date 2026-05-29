import { NextResponse } from 'next/server';
import { getUserIdFromSession } from '../../../lib/server/auth';
import { prisma } from '../../../lib/server/prisma';
import { medicationSchema } from '../../../lib/server/validation';
import { generateDoseRecordsForToday, refreshMissed } from '../../../lib/server/schedule';

export async function GET() {
  const userId = getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const meds = await prisma.medication.findMany({ where: { userId }, include: { schedule: true }, orderBy: { updatedAt: 'desc' } });
  return NextResponse.json(
    meds.map((m) => ({ ...m, schedule: m.schedule ? { ...m.schedule, times: JSON.parse(m.schedule.timesJson) } : null }))
  );
}

export async function POST(request: Request) {
  const userId = getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const input = medicationSchema.parse(await request.json());
  const created = await prisma.medication.create({
    data: {
      userId,
      name: input.name,
      note: input.note,
      dosageText: input.dosageText,
      isActive: input.isActive,
      schedule: {
        create: {
          userId,
          scheduleType: input.scheduleType,
          timesPerDay: input.timesPerDay,
          timesJson: JSON.stringify(input.times),
          startDate: input.startDate,
          endDate: input.endDate,
          timeZone: input.timeZone
        }
      }
    },
    include: { schedule: true }
  });

  await generateDoseRecordsForToday(userId);
  await refreshMissed(userId);
  return NextResponse.json(created, { status: 201 });
}
