import { DoseStatus, type MedicationSchedule } from '@prisma/client';
import { prisma } from '../infrastructure/prisma';
import { spreadTimes, toUtcDate, todayInZone } from '../utils/time';

const scheduleTimes = (schedule: MedicationSchedule): string[] => {
  const times = JSON.parse(schedule.timesJson) as string[];
  if (schedule.scheduleType === 'specific_times') return times;
  return spreadTimes(schedule.timesPerDay ?? 1);
};

export const generateDoseRecordsForToday = async (userId: string): Promise<void> => {
  const schedules = await prisma.medicationSchedule.findMany({
    where: { userId, medication: { isActive: true } }
  });

  for (const schedule of schedules) {
    const today = todayInZone(schedule.timeZone);
    if (schedule.startDate && today < schedule.startDate) continue;
    if (schedule.endDate && today > schedule.endDate) continue;

    for (const time of scheduleTimes(schedule)) {
      const scheduledAt = toUtcDate(today, time, schedule.timeZone);
      await prisma.doseRecord.upsert({
        where: {
          scheduleId_scheduledAt: {
            scheduleId: schedule.id,
            scheduledAt
          }
        },
        update: {},
        create: {
          userId,
          medicationId: schedule.medicationId,
          scheduleId: schedule.id,
          scheduledAt,
          status: DoseStatus.pending
        }
      });
    }
  }
};

export const refreshMissed = async (userId: string): Promise<void> => {
  const threshold = new Date(Date.now() - 30 * 60 * 1000);
  await prisma.doseRecord.updateMany({
    where: {
      userId,
      status: DoseStatus.pending,
      scheduledAt: { lt: threshold }
    },
    data: { status: DoseStatus.missed }
  });
};
