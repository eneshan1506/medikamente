import type { DoseRecord } from '../domain/types';
import { api } from '../infrastructure/api';

export const doseService = {
  today: () => api.get<DoseRecord[]>('/doses/today'),
  action: (doseId: string, action: 'taken' | 'snooze_10') => api.post<DoseRecord>(`/doses/${doseId}/actions`, { action })
};
