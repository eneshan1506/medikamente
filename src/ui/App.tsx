'use client';

import { useState } from 'react';
import { MedicationForm, type FormValues } from './components/MedicationForm';
import { TodayScreen } from './screens/TodayScreen';
import { useAppData } from './hooks/useAppData';

export const App = () => {
  const [tab, setTab] = useState<'today' | 'meds'>('today');
  const [editing, setEditing] = useState<FormValues | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const { user, medications, agenda, permission, error, stats, login, logout, refresh, saveMedication, deleteMedication, markTaken, snoozeDose } =
    useAppData();

  if (!user) {
    return (
      <main className="container">
        <header className="hero panel">
          <h1>Medikamente</h1>
          <p>Hesabınla giriş yap</p>
        </header>
        <form
          className="panel"
          onSubmit={(e) => {
            e.preventDefault();
            void login(email, password, registerMode);
          }}
        >
          <h2>{registerMode ? 'Kayıt ol' : 'Giriş yap'}</h2>
          <label htmlFor="auth-email">
            E-posta
            <input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label htmlFor="auth-password">
            Şifre
            <input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <div className="form-actions">
            <button type="submit">{registerMode ? 'Kayıt ol' : 'Giriş yap'}</button>
            <button type="button" onClick={() => setRegisterMode((v) => !v)}>
              {registerMode ? 'Giriş moduna dön' : 'Yeni hesap oluştur'}
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="hero panel hero-layout">
        <div className="hero-center">
          <div className="brand-row" aria-label="Uygulama markası">
            <span className="brand-mark" aria-hidden="true">💊</span>
            <h1>Medikamente ✨</h1>
          </div>
          <p>Tek kullanıcı ilaç takip MVP</p>
        </div>
        <aside className="hero-user" aria-label="Kullanıcı bilgisi">
          <strong>{user.email}</strong>
          <button onClick={() => void logout()}>Çıkış yap</button>
        </aside>
      </header>

      <nav className="tabs" aria-label="Sekmeler">
        <button className={tab === 'today' ? 'active' : ''} onClick={() => setTab('today')}>
          Bugün
        </button>
        <button className={tab === 'meds' ? 'active' : ''} onClick={() => setTab('meds')}>
          İlaçlar
        </button>
      </nav>

      {tab === 'today' ? (
        <>
          <section className="stats" aria-label="Gün özeti">
            <article className="panel stat-card">
              <small>Bekliyor</small>
              <strong>{stats.pending}</strong>
            </article>
            <article className="panel stat-card">
              <small>Kaçırıldı</small>
              <strong>{stats.missed}</strong>
            </article>
            <article className="panel stat-card">
              <small>Alındı</small>
              <strong>{stats.taken}</strong>
            </article>
          </section>

          <section className="panel info-panel">
            <p>
              Bildirim izni: <span className={`pill pill-${permission}`}>{permission}</span>
            </p>
            <button onClick={() => void refresh()}>Yenile</button>
            {permission === 'denied' ? <p className="error">Bildirim izni kapalı. Tarayıcı ayarından açın.</p> : null}
            {error ? <p className="error">{error}</p> : null}
          </section>
          <TodayScreen agenda={agenda} onTaken={markTaken} onSnooze={snoozeDose} />
        </>
      ) : (
        <>
          <section className="panel" aria-label="İlaç listesi">
            <h2>Kayıtlı ilaçlar</h2>
            <ul className="list">
              {medications.map((med) => (
                <li key={med.id} className="row">
                  <div>
                    <strong>{med.name}</strong>
                    <p>{med.dosageText}</p>
                    <small>{med.schedule?.scheduleType === 'specific_times' ? med.schedule.times.join(', ') : `Günde ${med.schedule?.timesPerDay} kez`}</small>
                  </div>
                  <div className="list-actions">
                    <button
                      onClick={() => {
                        setEditing({
                          id: med.id,
                          name: med.name,
                          note: med.note ?? '',
                          dosageText: med.dosageText,
                          isActive: med.isActive,
                          scheduleType: med.schedule?.scheduleType ?? 'specific_times',
                          timesPerDay: med.schedule?.timesPerDay ?? undefined,
                          times: med.schedule?.times ?? ['08:00', '14:00', '22:00'],
                          startDate: med.schedule?.startDate ?? undefined,
                          endDate: med.schedule?.endDate ?? undefined
                        });
                        setIsFormOpen(true);
                      }}
                    >
                      Düzenle
                    </button>
                    <button
                      onClick={async () => {
                        await deleteMedication(med.id);
                        if (editing?.id === med.id) setEditing(undefined);
                        await refresh();
                      }}
                    >
                      Sil
                    </button>
                  </div>
                </li>
              ))}
              {medications.length === 0 ? <li>Henüz ilaç yok.</li> : null}
            </ul>
          </section>
          <button
            className="fab-add"
            aria-label="İlaç ekle"
            onClick={() => {
              setEditing(undefined);
              setIsFormOpen(true);
            }}
          >
            +
          </button>
          {isFormOpen ? (
            <section className="modal-backdrop" role="dialog" aria-modal="true" aria-label="İlaç ekleme penceresi">
              <div className="modal-card">
                <div className="modal-topbar">
                  <button
                    type="button"
                    className="modal-close"
                    aria-label="Pencereyi kapat"
                    onClick={() => {
                      setEditing(undefined);
                      setIsFormOpen(false);
                    }}
                  >
                    Kapat
                  </button>
                </div>
                <MedicationForm
                  initial={editing}
                  onCancel={() => {
                    setEditing(undefined);
                    setIsFormOpen(false);
                  }}
                  onSave={async (data) => {
                    await saveMedication(data);
                    setEditing(undefined);
                    setIsFormOpen(false);
                    await refresh();
                  }}
                />
              </div>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
};
