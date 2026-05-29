export type User = {
  id: string;
  email: string;
  timeZone: string;
};

export type Medication = {
  id: string;
  userId: string;
  name: string;
  note?: string | null;
  dosageText: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleType = 'times_per_day' | 'specific_times';

export type MedicationSchedule = {
  id: string;
  medicationId: string;
  scheduleType: ScheduleType;
  timesPerDay?: number | null;
  times: string[];
  startDate?: string | null;
  endDate?: string | null;
  timeZone: string;
  createdAt: string;
  updatedAt: string;
};

export type MedicationWithSchedule = Medication & {
  schedule: (Omit<MedicationSchedule, 'times'> & { times: string[] }) | null;
};

export type DoseStatus = 'pending' | 'taken' | 'missed' | 'snoozed';

export type DoseRecord = {
  id: string;
  medicationId: string;
  scheduleId: string;
  scheduledAt: string;
  status: DoseStatus;
  actedAt?: string | null;
  snoozedUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  medication: Medication;
};
