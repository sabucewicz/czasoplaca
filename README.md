# CzasoPłaca — Work Hours & Earnings Tracker (PWA)

[Wersja polska poniżej / Polish version below](#-wersja-polska)

---

## 🇬🇧 English Version

**CzasoPłaca** is a responsive **Progressive Web App (PWA)** built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS** for tracking work hours, setting custom hourly rates and daily targets, and calculating earnings in real time with local browser persistence (`localStorage`).

### 🚀 Key Features

- **Live Session Timer:** Start/Stop work timer with active session persistence across reloads and safe week-boundary handling (`addEntryToState`).
- **Custom Hourly Rate & Daily Target:** Edit your hourly rate (`PLN/h`) and daily target hours inline; earnings update live.
- **Weekly Bar Chart & CSV Export:** 7-day breakdown (`Mon–Sun`) with target indicator, click-to-add per day, UTF-8 CSV export (with formula-injection escaping), and two-step week closing confirmation.
- **Entry Notes & Safe Undo:** Add, edit, and annotate shifts (including overnight shifts) with a 6-second Undo toast on deletion.
- **5-Week Archive & Offline PWA:** Automatically rolls over closed weeks at week boundaries (retaining up to 5 weeks) and supports mobile/desktop installation via `vite-plugin-pwa`.

### 🧰 Tech Stack

- **Frontend:** React 19, TypeScript (`strict`), Vite 8, Tailwind CSS v4, Lucide Icons
- **PWA & Storage:** `vite-plugin-pwa`, Web Storage (`localStorage`)
- **Testing & CI/CD:** Node.js built-in test runner (`node --test`), GitHub Actions (`lint`, `test`, `build`) deploying to GitHub Pages

### ⚙️ Local Development & Verification

```bash
npm install
npm run dev
```

Typecheck, unit tests, and production build:

```bash
npm run check
npm run build
```

---

## 🇵🇱 Wersja Polska

**CzasoPłaca** to responsywna aplikacja webowa **PWA (Progressive Web App)** w **React**, **TypeScript**, **Vite** i **Tailwind CSS** do mierzenia czasu pracy, konfiguracji własnej stawki godzinowej oraz celu dziennego i przeliczania zarobków na żywo z zapisem w `localStorage`.

### 🚀 Funkcje

- **Stoper sesji na żywo:** Przycisk Start/Stop z zapisem aktywnej sesji w przeglądarce oraz bezpiecznym zapisem sesji przechodzących przez granicę tygodnia.
- **Własna stawka godzinowa i cel dzienny:** Szybka edycja stawki (`zł/h`) oraz celu dziennego (domyślnie `8h`) z bieżącym paskiem postępu.
- **Wykres tygodnia i eksport CSV:** Podsumowanie 7 dni (`Pon–Niedz`) z linią celu dziennego, dodawaniem wpisów jednym kliknięciem na dzień, eksportem do CSV (UTF-8 z zabezpieczeniem przed formułami) oraz bezpiecznym zamykaniem tygodnia z potwierdzeniem.
- **Notatki i bezpieczne usuwanie:** Możliwość dodawania notatek do zmian (w tym zmian nocnych) oraz cofnięcie usunięcia wpisu (`Cofnij`).
- **Archiwum 5 tygodni i tryb offline (PWA):** Automatyczne zamykanie zakończonych tygodni (historia do 5 tygodni) i możliwość instalacji jako aplikacja dzięki `vite-plugin-pwa`.

### ⚙️ Uruchomienie i testy

```bash
npm install
npm run dev
```

Sprawdzenie typów, testy jednostkowe i build produkcyjny:

```bash
npm run check
npm run build
```
