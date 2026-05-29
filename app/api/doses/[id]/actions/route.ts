import { DoseStatus } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getUserIdFromSession } from '../../../../../lib/server/auth';
import { prisma } from '../../../../../lib/server/prisma';
import { doseActionSchema } from '../../../../../lib/server/validation';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const userId = getUserIdFromSession();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action } = doseActionSchema.parse(await request.json());
  const dose = await prisma.doseRecord.findFirst({ where: { id: params.id, userId } });
  if (!dose) return NextResponse.json({ error: 'Dose not found' }, { status: 404 });

  if (action === 'taken') {
    const updated = await prisma.doseRecord.update({ where: { id: dose.id }, data: { status: DoseStatus.taken, actedAt: new Date() } });
    return NextResponse.json(updated);
  }

  const base = dose.snoozedUntil ?? dose.scheduledAt;
  const next = new Date(Math.max(Date.now(), base.getTime()) + 10 * 60 * 1000);
  const updated = await prisma.doseRecord.update({ where: { id: dose.id }, data: { status: DoseStatus.snoozed, snoozedUntil: next, notifiedAt: null } });
  return NextResponse.json(updated);
}
