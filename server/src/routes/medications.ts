import { Router } from 'express';
import { medicationSchema } from '../domain/contracts';
import { prisma } from '../infrastructure/prisma';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { generateDoseRecordsForToday, refreshMissed } from '../application/schedule';

export const medicationRouter = Router();
medicationRouter.use(requireAuth);

medicationRouter.get('/', async (req: AuthRequest, res) => {
  const meds = await prisma.medication.findMany({ where: { userId: req.userId! }, include: { schedule: true }, orderBy: { updatedAt: 'desc' } });
  return res.json(
    meds.map((m) => ({
      ...m,
      schedule: m.schedule
        ? {
            ...m.schedule,
            times: JSON.parse(m.schedule.timesJson)
          }
        : null
    }))
  );
});

medicationRouter.post('/', async (req: AuthRequest, res) => {
  const input = medicationSchema.parse(req.body);
  const created = await prisma.medication.create({
    data: {
      userId: req.userId!,
      name: input.name,
      note: input.note,
      dosageText: input.dosageText,
      isActive: input.isActive,
      schedule: {
        create: {
          userId: req.userId!,
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

  await generateDoseRecordsForToday(req.userId!);
  await refreshMissed(req.userId!);
  return res.status(201).json(created);
});

medicationRouter.put('/:id', async (req: AuthRequest, res) => {
  const input = medicationSchema.parse(req.body);
  const existing = await prisma.medication.findFirst({ where: { id: req.params.id, userId: req.userId! }, include: { schedule: true } });
  if (!existing) return res.status(404).json({ error: 'Medication not found' });

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
            userId: req.userId!,
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

  await generateDoseRecordsForToday(req.userId!);
  await refreshMissed(req.userId!);
  return res.json(updated);
});

medicationRouter.delete('/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.medication.findFirst({ where: { id: req.params.id, userId: req.userId! } });
  if (!existing) return res.status(404).json({ error: 'Medication not found' });
  await prisma.medication.delete({ where: { id: existing.id } });
  return res.status(204).send();
});
