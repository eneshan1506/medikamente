import { useCallback, useEffect, useMemo, useState } from 'react';
import { authService } from '../../core/application/authService';
import { doseService } from '../../core/application/doseService';
import { medicationService, type MedicationUpsertInput } from '../../core/application/medicationService';
import type { DoseRecord, MedicationWithSchedule, User } from '../../core/domain/types';
import { ensureNotificationPermission, subscribePush } from '../../core/infrastructure/notification';
import { browserTimeZone } from '../../core/shared/time';

export const useAppData = () => {
  const [user, setUser] = useState<User | null>(null);
  const [medications, setMedications] = useState<MedicationWithSchedule[]>([]);
  const [agenda, setAgenda] = useState<DoseRecord[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    const [meds, today] = await Promise.all([medicationService.list(), doseService.today()]);
    setMedications(meds);
    setAgenda(today);
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    await loadData();
  }, [user, loadData]);

  const bootstrap = useCallback(async () => {
    try {
      const me = await authService.me();
      setUser(me);
      if (me.timeZone !== browserTimeZone()) {
        const updated = await authService.updateTimezone(browserTimeZone());
        setUser(updated);
      }
      await loadData();
      const p = await ensureNotificationPermission();
      setPermission(p);
      if (p === 'granted') await subscribePush();
      setError('');
    } catch {
      setUser(null);
    }
  }, [loadData]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const onMessage = async (event: MessageEvent) => {
      const action = event.data?.action as 'taken' | 'snooze_10' | undefined;
      const doseId = event.data?.doseId as string | undefined;
      if (!action || !doseId) return;
      await doseService.action(doseId, action);
      await refresh();
    };
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
  }, [refresh]);

  const login = async (email: string, password: string, isRegister: boolean) => {
    try {
      const me = isRegister ? await authService.register({ email, password }) : await authService.login({ email, password });
      setUser(me);
      await loadData();
      const p = await ensureNotificationPermission();
      setPermission(p);
      if (p === 'granted') await subscribePush();
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Giriş başarısız');
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setMedications([]);
    setAgenda([]);
  };

  const saveMedication = async (input: Omit<MedicationUpsertInput, 'timeZone'>) => {
    await medicationService.save({ ...input, timeZone: user?.timeZone ?? browserTimeZone() });
    await refresh();
  };

  const deleteMedication = async (id: string) => {
    await medicationService.remove(id);
    await refresh();
  };

  const markTaken = async (doseId: string) => {
    await doseService.action(doseId, 'taken');
    await refresh();
  };

  const snoozeDose = async (doseId: string) => {
    await doseService.action(doseId, 'snooze_10');
    await refresh();
  };

  const stats = useMemo(() => {
    const pending = agenda.filter((a) => a.status === 'pending' || a.status === 'snoozed').length;
    const missed = agenda.filter((a) => a.status === 'missed').length;
    const taken = agenda.filter((a) => a.status === 'taken').length;
    return { pending, missed, taken };
  }, [agenda]);

  return {
    user,
    medications,
    agenda,
    permission,
    error,
    stats,
    login,
    logout,
    refresh,
    saveMedication,
    deleteMedication,
    markTaken,
    snoozeDose
  };
};
