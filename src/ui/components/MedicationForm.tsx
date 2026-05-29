import { useEffect, useState } from 'react';
import type { ScheduleType } from '../../core/domain/types';

export type FormValues = {
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
};

type Props = {
  initial?: FormValues;
  onSave: (value: FormValues) => Promise<void>;
  onCancel?: () => void;
};

const emptyForm = (): FormValues => ({
  name: '',
  note: '',
  dosageText: '',
  isActive: true,
  scheduleType: 'specific_times',
  times: ['08:00', '14:00', '22:00']
});

export const MedicationForm = ({ initial, onSave, onCancel }: Props) => {
  const [form, setForm] = useState<FormValues>(initial ?? emptyForm());
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState<Partial<Record<keyof FormValues, string>>>({});
  const isEditMode = Boolean(initial?.id);

  useEffect(() => {
    setForm(initial ?? emptyForm());
    setSelectedTime(initial?.times?.[0] ?? '08:00');
    setError('');
  }, [initial]);

  const update = (patch: Partial<FormValues>) => setForm((prev) => ({ ...prev, ...patch }));
  const clearFieldError = (key: keyof FormValues) => setFieldError((prev) => ({ ...prev, [key]: undefined }));
  const normalizeTimes = (times: string[]) => Array.from(new Set(times)).sort((a, b) => (a < b ? -1 : 1));
  const addTime = (time: string) => {
    if (!time) return;
    update({ times: normalizeTimes([...form.times, time]) });
    clearFieldError('times');
  };
  const removeTime = (time: string) => {
    update({ times: form.times.filter((v) => v !== time) });
    clearFieldError('times');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await onSave({ ...form, isActive: true, scheduleType: 'specific_times', timesPerDay: undefined });
      setError('');
      setFieldError({});
      if (!isEditMode) {
        setForm(emptyForm());
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Form kaydedilemedi';
      setError(message);
      const next: Partial<Record<keyof FormValues, string>> = {};
      if (message.includes('İlaç adı')) next.name = message;
      if (message.includes('Doz')) next.dosageText = message;
      if (message.includes('saat')) next.times = message;
      if (message.includes('Günlük tekrar')) next.timesPerDay = message;
      if (message.includes('Bitiş tarihi')) next.endDate = message;
      setFieldError(next);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="panel" aria-label="İlaç formu">
      <h2>{isEditMode ? 'İlacı düzenle' : 'İlaç ekle'}</h2>
      <label htmlFor="med-name">
        İlaç adı
        <input
          id="med-name"
          value={form.name}
          onChange={(e) => {
            update({ name: e.target.value });
            clearFieldError('name');
          }}
          aria-invalid={Boolean(fieldError.name)}
          aria-describedby={fieldError.name ? 'med-name-error' : undefined}
          required
        />
        {fieldError.name ? <small id="med-name-error" className="error">{fieldError.name}</small> : null}
      </label>
      <label htmlFor="med-dose">
        Doz
        <input
          id="med-dose"
          value={form.dosageText}
          onChange={(e) => {
            update({ dosageText: e.target.value });
            clearFieldError('dosageText');
          }}
          aria-invalid={Boolean(fieldError.dosageText)}
          aria-describedby={fieldError.dosageText ? 'med-dose-error' : undefined}
          required
        />
        {fieldError.dosageText ? <small id="med-dose-error" className="error">{fieldError.dosageText}</small> : null}
      </label>
      <label htmlFor="med-note">
        Not (opsiyonel)
        <textarea id="med-note" value={form.note} onChange={(e) => update({ note: e.target.value })} rows={2} />
      </label>
      <label htmlFor="med-time-picker">
        Saat seçimi
        <div className="time-picker-row">
          <input
            id="med-time-picker"
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            aria-invalid={Boolean(fieldError.times)}
            aria-describedby={fieldError.times ? 'med-times-error' : undefined}
          />
          <button type="button" onClick={() => addTime(selectedTime)}>
            Saat ekle
          </button>
        </div>
        <div className="quick-times" aria-label="Hızlı saat seçenekleri">
          <button type="button" onClick={() => addTime('08:00')}>Sabah</button>
          <button type="button" onClick={() => addTime('12:00')}>Öğle</button>
          <button type="button" onClick={() => addTime('20:00')}>Akşam</button>
          <button type="button" onClick={() => addTime('22:00')}>Yatmadan</button>
        </div>
        <div className="time-chip-list" aria-label="Seçilen saatler">
          {form.times.map((time) => (
            <span key={time} className="time-chip">
              {time}
              <button type="button" aria-label={`${time} saatini sil`} onClick={() => removeTime(time)}>
                ×
              </button>
            </span>
          ))}
        </div>
        {fieldError.times ? <small id="med-times-error" className="error">{fieldError.times}</small> : null}
      </label>
      <label htmlFor="med-start-date">
        Başlangıç
        <input
          id="med-start-date"
          type="date"
          value={form.startDate ?? ''}
          onChange={(e) => update({ startDate: e.target.value || undefined })}
        />
      </label>
      <label htmlFor="med-end-date">
        Bitiş
        <input
          id="med-end-date"
          type="date"
          value={form.endDate ?? ''}
          onChange={(e) => {
            update({ endDate: e.target.value || undefined });
            clearFieldError('endDate');
          }}
          aria-invalid={Boolean(fieldError.endDate)}
          aria-describedby={fieldError.endDate ? 'med-end-date-error' : undefined}
        />
        {fieldError.endDate ? <small id="med-end-date-error" className="error">{fieldError.endDate}</small> : null}
      </label>
      {error ? <p className="error" aria-live="polite">{error}</p> : null}
      <div className="form-actions">
        <button type="submit">{isEditMode ? 'Güncelle' : 'Kaydet'}</button>
        {isEditMode && onCancel ? (
          <button type="button" onClick={onCancel}>
            İptal
          </button>
        ) : null}
      </div>
    </form>
  );
};
