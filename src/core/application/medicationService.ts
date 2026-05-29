import type { MedicationWithSchedule, ScheduleType } from '../domain/types';
import { api } from '../infrastructure/api';

export type MedicationUpsertInput = {
  id?: string;
  name: string;
  note?: string;
  dosageText: string;
  isActive: boolean;
  scheduleType: ScheduleType;
  timesPerDay?: number;
  times: string[];
  startDate?: string;
  endDate?: string;
  timeZone: string;
};

export const medicationService = {
  list: () => api.get<MedicationWithSchedule[]>('/medications'),
  save: (input: MedicationUpsertInput) =>
    input.id ? api.put<MedicationWithSchedule>(`/medications/${input.id}`, input) : api.post<MedicationWithSchedule>('/medications', input),
  remove: (id: string) => api.delete<void>(`/medications/${id}`)
};
