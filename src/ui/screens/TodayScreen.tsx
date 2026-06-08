import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { DoseRecord, Medication } from '../../core/domain/types';

type Item = DoseRecord & { medication: Medication };

type Props = {
  agenda: Item[];
  onTaken: (doseId: string) => Promise<void>;
  onSnooze: (doseId: string) => Promise<void>;
};

export const TodayScreen = ({ agenda, onTaken, onSnooze }: Props) => (
  <section className="panel" aria-label="Bugün dozları">
    <h2>Bugün</h2>
    <ul className="list">
      {agenda.map((item) => (
        <li key={item.id} className={`row status-${item.status}`}>
          <div>
            <strong>{item.medication.name}</strong>
            <p>{item.medication.dosageText}</p>
            <small>{format(new Date(item.scheduledAt), 'HH:mm', { locale: tr })}</small>
          </div>
          <div className="actions">
            <span className={`status-pill status-pill-${item.status}`}>{item.status}</span>
            <button onClick={() => onTaken(item.id)} disabled={item.status === 'taken'}>
              Aldım
            </button>
            <button onClick={() => onSnooze(item.id)}>45 dk ertele</button>
          </div>
        </li>
      ))}
      {agenda.length === 0 ? <li>Bugün planlanmış doz yok.</li> : null}
    </ul>
  </section>
);
