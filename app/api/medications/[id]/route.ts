import { NextResponse } from 'next/server';
import { getUserIdFromSession } from '../../../../lib/server/auth';
import { prisma } from '../../../../lib/server/prisma';
import { medicationSchema } from '../../../../lib/server/validation';
import { generateDoseRecordsForToday, refreshMissed } from '../../../../lib/server/schedule';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const input = medicationSchema.parse(await request.json());
  const existing = await prisma.medication.findFirst({ where: { id: params.id, userId }, include: { schedule: true } });
  if (!existing) return NextResponse.json({ error: 'Medication not found' }, { status: 404 });

  const updated = await prisma.medication.update({
    where: { id: existing.id },
    data: {
      name: input.name,
      note: input.note,
      dosageText: input.dosageText,
      isActive: input.isActive,
      schedule: {
        upsert: {
          create: {
            userId,
            scheduleType: input.scheduleType,
            timesPerDay: input.timesPerDay,
            timesJson: JSON.stringify(input.times),
            startDate: input.startDate,
            endDate: input.endDate,
            timeZone: input.timeZone
          },
          update: {
            scheduleType: input.scheduleType,
            timesPerDay: input.timesPerDay,
            timesJson: JSON.stringify(input.times),
            startDate: input.startDate,
            endDate: input.endDate,
            timeZone: input.timeZone
          }
        }
      }
    },
    include: { schedule: true }
  });

  await generateDoseRecordsForToday(userId);
  await refreshMissed(userId);
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await prisma.medication.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Medication not found' }, { status: 404 });

  await prisma.medication.delete({ where: { id: existing.id } });
  return new NextResponse(null, { status: 204 });
}
