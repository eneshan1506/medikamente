# Medikamente MVP - Yapılan Çalışmalar

Bu doküman, projede şimdiye kadar yapılan teknik kararları, geliştirmeleri ve UI/UX düzenlemelerini özetler.

## 1) Teknik Temel ve Kurulum

- `React + TypeScript + Vite + PWA` iskeleti kuruldu.
- Paket yöneticisi olarak `pnpm` kullanıldı.
- PWA için `vite-plugin-pwa` eklendi.
- Service Worker akışı (`injectManifest`) kuruldu.
- Build doğrulaması çalışır hale getirildi.

### Eklenen ana bağımlılıklar

- `react`, `react-dom`
- `typescript`, `vite`
- `vite-plugin-pwa`
- `dexie` (IndexedDB)
- `zod` (validasyon)
- `date-fns`
- `workbox-precaching`, `workbox-window`

## 2) Mimari Yapı

Katmanlı yapı kuruldu:

- `domain`: entity tipleri ve validasyon
- `application`: iş kuralları / servisler
- `infrastructure`: storage, id üretimi, notification
- `ui`: ekranlar, bileşenler, hook'lar

Klasör yapısı:

- `src/core/domain`
- `src/core/application`
- `src/core/infrastructure`
- `src/ui/components`
- `src/ui/screens`
- `src/ui/hooks`

## 3) Veri Modeli

### Medication
- `id`
- `name`
- `note?`
- `dosageText`
- `isActive`
- `createdAt`, `updatedAt`

### MedicationSchedule
- `id`
- `medicationId`
- `scheduleType` (`times_per_day` | `specific_times`)
- `timesPerDay?`
- `times[]`
- `startDate?`, `endDate?`
- `timeZone`
- `createdAt`, `updatedAt`

### DoseRecord
- `id`
- `medicationId`
- `scheduleId`
- `scheduledAt`
- `status` (`pending` | `taken` | `missed` | `snoozed`)
- `actedAt?`
- `snoozedUntil?`
- `createdAt`, `updatedAt`

## 4) Uygulama Servisleri

### medicationService
- İlaç listeleme
- İlaç ekleme/güncelleme (`upsert`)
- İlaç silme (ilişkili schedule ve kayıtlarla birlikte)

### scheduleService
- Günlük doz üretimi (`generateTodayDoses`)
- Günlük ajanda çekme (`getTodayAgenda`)
- Doz alma (`markTaken`)
- Erteleme (`snoozeDose`, 45 dk)
- Kaçırılanları işaretleme (`refreshMissedStatuses`)
- Bildirim zamanı gelenleri bulma (`dueForNotification`)

## 5) PWA ve Bildirim

- Web Notification izin akışı eklendi.
- Service Worker notification click action handling eklendi.
- Notification aksiyonları:
  - `Aldım`
  - `45 dk ertele`
- SW -> UI `postMessage` ile aksiyonlar işlendi.

## 6) UI/UX Geliştirmeleri

### Genel tasarım
- Sağlık uygulamasına uygun sakin teal/yeşil palet uygulandı.
- Yüksek kontrast ve okunabilir tipografi korundu.
- Kart bazlı sade düzen yapısı benimsendi.

### Erişilebilirlik
- `focus-visible` belirgin hale getirildi.
- Tıklanabilir alanlarda minimum 44px hedef korundu.
- `prefers-reduced-motion` desteği eklendi/korundu.
- Form alanlarına `id + htmlFor` bağlandı.
- Alan bazlı hata sunumu (`aria-invalid`, `aria-describedby`) eklendi.

### Bugün ekranı
- Durumlar için görsel pill/badge ayrımı:
  - pending
  - snoozed
  - taken
  - missed

### İlaçlar ekranı
- İlaç düzenleme akışı eklendi.
- Düzenleme modunda `Güncelle` ve `İptal` eklendi.

## 7) İstenen Son UX Akışları

Kullanıcı geri bildirimlerine göre yapılan son düzenlemeler:

1. `İlaçlar` sekmesi açıldığında doğrudan ilaç listesi gösterildi.
2. Sağ altta yuvarlak `+` (FAB) `İlaç ekle` butonu eklendi.
3. FAB tıklanınca modal/pencere içinde ilaç formu açıldı.
4. Modal içinde görünür `Kapat` tuşu eklendi.
5. Modal içerisi aşağı doğru kaydırılabilir (`overflow-y`) yapıldı.
6. Özet/bildirim kutuları `İlaçlar` sekmesinden kaldırıldı; sadece `Bugün` sekmesine alındı.

## 8) Dosya Bazlı Önemli Değişiklikler

- `src/ui/App.tsx`
  - Sekme bazlı içerik ayrımı
  - FAB + modal form açma
  - İlaç düzenleme/silme akışı
  - Özet kartlarını sadece `Bugün` sekmesine alma

- `src/ui/components/MedicationForm.tsx`
  - Edit mode
  - `id/htmlFor` erişilebilir etiketleme
  - Alan bazlı validasyon hata gösterimi
  - İptal/Güncelle aksiyonları

- `src/ui/screens/TodayScreen.tsx`
  - Status pill görselleştirmesi

- `src/ui/styles.css`
  - Teal odaklı token sistemi
  - Responsive iyileştirmeler (mobile/tablet)
  - FAB, modal, topbar ve close button stilleri
  - A11y ve motion kuralları

## 9) Teknik Notlar

- `localhost:5173`, Vite'ın varsayılan development portudur.
- Port istenirse `vite.config.ts` veya `pnpm dev -- --port <port>` ile değiştirilebilir.

## 10) Doğrulama

- Her büyük adım sonrası `pnpm build` çalıştırıldı.
- Son durumda build başarılı.
