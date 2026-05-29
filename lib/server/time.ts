import { DateTime } from 'luxon';

export const spreadTimes = (count: number): string[] => {
  const interval = Math.floor(14 * 60 / Math.max(1, count - 1));
  return Array.from({ length: count }, (_, i) => {
    const total = 8 * 60 + i * interval;
    const h = `${Math.floor(total / 60)}`.padStart(2, '0');
    const m = `${total % 60}`.padStart(2, '0');
    return `${h}:${m}`;
  });
};

export const resolveLocalDateTime = (date: string, time: string, zone: string): DateTime => {
  let dt = DateTime.fromISO(`${date}T${time}`, { zone, setZone: true });

  if (!dt.isValid) {
    let probe = DateTime.fromISO(`${date}T00:00`, { zone, setZone: true });
    for (let i = 0; i < 180; i++) {
      probe = probe.plus({ minutes: 1 });
      if (probe.toFormat('HH:mm') >= time && probe.isValid) {
        return probe;
      }
    }
  }

  const offsets = dt.getPossibleOffsets();
  if (offsets.length > 1) {
    offsets.sort((a, b) => b.offset - a.offset);
    dt = offsets[0];
  }

  return dt;
};

export const todayInZone = (zone: string): string => DateTime.now().setZone(zone).toISODate()!;
export const toUtcDate = (date: string, time: string, zone: string): Date =>
  resolveLocalDateTime(date, time, zone).toUTC().toJSDate();
