import { DoseStatus } from '@prisma/client';
import { DateTime } from 'luxon';
import { Router } from 'express';
import { doseActionSchema } from '../domain/contracts';
import { generateDoseRecordsForToday, refreshMissed } from '../application/schedule';
import { prisma } from '../infrastructure/prisma';
import { requireAuth, type AuthRequest } from '../middleware/auth';

export const doseRouter = Router();
doseRouter.use(requireAuth);

doseRouter.get('/today', async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  await generateDoseRecordsForToday(user.id);
  await refreshMissed(user.id);

  const start = DateTime.now().setZone(user.timeZone).startOf('day').toUTC().toJSDate();
  const end = DateTime.now().setZone(user.timeZone).endOf('day').toUTC().toJSDate();

  const records = await prisma.doseRecord.findMany({
    where: { userId: user.id, scheduledAt: { gte: start, lte: end } },
    include: { medication: true },
    orderBy: { scheduledAt: 'asc' }
  });

  return res.json(records);
});

doseRouter.post('/:id/actions', async (req: AuthRequest, res) => {
  const { action } = doseActionSchema.parse(req.body);
  const dose = await prisma.doseRecord.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!dose) return res.status(404).json({ error: 'Dose not found' });

  if (action === 'taken') {
    const updated = await prisma.doseRecord.update({ where: { id: dose.id }, data: { status: DoseStatus.taken, actedAt: new Date() } });
    return res.json(updated);
  }

  const base = dose.snoozedUntil ?? dose.scheduledAt;
  const next = new Date(Math.max(Date.now(), base.getTime()) + 10 * 60 * 1000);
  const updated = await prisma.doseRecord.update({
    where: { id: dose.id },
    data: { status: DoseStatus.snoozed, snoozedUntil: next, notifiedAt: null }
  });
  return res.json(updated);
});
