import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const medicationSchema = z.object({
  name: z.string().min(1, 'İlaç adı zorunlu').max(80),
  note: z.string().max(300).optional(),
  dosageText: z.string().min(1, 'Doz bilgisi zorunlu').max(80),
  isActive: z.boolean()
});

export const scheduleSchema = z
  .object({
    scheduleType: z.enum(['times_per_day', 'specific_times']),
    timesPerDay: z.number().int().min(1).max(6).optional(),
    times: z.array(z.string().regex(timeRegex, 'Saat HH:mm formatında olmalı')).default([]),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    timeZone: z.string().min(1)
  })
  .superRefine((value, ctx) => {
    if (value.scheduleType === 'times_per_day' && !value.timesPerDay) {
      ctx.addIssue({ code: 'custom', message: 'Günlük tekrar sayısı gerekli', path: ['timesPerDay'] });
    }
    if (value.scheduleType === 'specific_times' && value.times.length === 0) {
      ctx.addIssue({ code: 'custom', message: 'En az bir saat seçin', path: ['times'] });
    }
    if (value.startDate && value.endDate && value.startDate > value.endDate) {
      ctx.addIssue({ code: 'custom', message: 'Bitiş tarihi başlangıçtan önce olamaz', path: ['endDate'] });
    }
  });
