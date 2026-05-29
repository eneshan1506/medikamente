import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginSchema = registerSchema;

export const medicationSchema = z
  .object({
    name: z.string().min(1).max(80),
    note: z.string().max(300).optional(),
    dosageText: z.string().min(1).max(80),
    isActive: z.boolean(),
    scheduleType: z.enum(['times_per_day', 'specific_times']),
    timesPerDay: z.number().int().min(1).max(6).optional(),
    times: z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    timeZone: z.string().min(1)
  })
  .superRefine((v, ctx) => {
    if (v.scheduleType === 'specific_times' && v.times.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['times'], message: 'En az bir saat gerekli' });
    }
    if (v.scheduleType === 'times_per_day' && !v.timesPerDay) {
      ctx.addIssue({ code: 'custom', path: ['timesPerDay'], message: 'Günlük adet gerekli' });
    }
  });

export const timezoneSchema = z.object({ timeZone: z.string().min(1) });
export const pushSchema = z.object({ endpoint: z.string().url(), keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }) });
export const doseActionSchema = z.object({ action: z.enum(['taken', 'snooze_10']) });
