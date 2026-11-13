import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Header } from './components/Header';
import { SessionTimer } from './components/SessionTimer';
import { WeeklyChart } from './components/WeeklyChart';
import { WorkEntriesList } from './components/WorkEntriesList';
import { WeeksArchive } from './components/WeeksArchive';
import { EntryModal } from './components/EntryModal';
import {
  DEFAULT_HOURLY_RATE,
  DEFAULT_DAILY_TARGET_HOURS,
  MAX_ARCHIVED_WEEKS,
  toDateString,
  toTimeString,
  getWeekBounds,
  checkAndRolloverWeek,
  addEntryToState,
  summarizeWeekEntries,
  archiveWeekWithCap,
  createEmptyState,
  formatDateWithWeekday,
  type AppStorageState,
  type WorkEntry,
} from './utils/workTime';

const LEGACY_STORAGE_KEY = 'czasoplaca_storage_v1';
const STORAGE_KEY = 'czasoplaca_storage_v2';
const THEME_KEY = 'czasoplaca_theme_v1';

function loadStateFromStorage(): AppStorageState {
  const now = new Date();
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const emptyState = createEmptyState(now);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState));
      return emptyState;
    }
    const parsed = JSON.parse(raw) as Partial<AppStorageState>;
    const { weekKey } = getWeekBounds(now);

    const hydrated: AppStorageState = {
      hourlyRate:
        typeof parsed.hourlyRate === 'number' && parsed.hourlyRate > 0
          ? parsed.hourlyRate
          : DEFAULT_HOURLY_RATE,
      dailyTargetHours:
        typeof parsed.dailyTargetHours === 'number' &&
        parsed.dailyTargetHours >= 0.5 &&
        parsed.dailyTargetHours <= 24
          ? parsed.dailyTargetHours
          : DEFAULT_DAILY_TARGET_HOURS,
      currentWeekKey: parsed.currentWeekKey || weekKey,
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      archivedWeeks: Array.isArray(parsed.archivedWeeks)
        ? parsed.archivedWeeks.slice(0, MAX_ARCHIVED_WEEKS)
        : [],
      activeSession: parsed.activeSession || null,
    };

    return checkAndRolloverWeek(hydrated, now);
  } catch {
    return createEmptyState(now);
  }
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  const [state, setState] = useState<AppStorageState>(() => loadStateFromStorage());
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<string>(() => toDateString(new Date()));
  const [lastDeletedEntry, setLastDeletedEntry] = useState<WorkEntry | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignoruj błędy dostępu do localStorage (np. tryb prywatny)
    }
  }, [isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignoruj błędy zapisu do localStorage
    }
  }, [state]);

  useEffect(() => {
    const tick = () => {
      const currentNow = new Date();
      setNowMs(currentNow.getTime());
      setState((prev) => checkAndRolloverWeek(prev, currentNow));
    };

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        tick();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', tick);
    window.addEventListener('pageshow', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', tick);
      window.removeEventListener('pageshow', tick);
    };
  }, []);

  useEffect(() => {
    if (!lastDeletedEntry) return;
    const timer = setTimeout(() => setLastDeletedEntry(null), 6000);
    return () => clearTimeout(timer);
  }, [lastDeletedEntry]);

  const todayStr = toDateString(new Date(nowMs));

  const elapsedSeconds = state.activeSession?.isRunning
    ? Math.max(0, Math.floor((nowMs - state.activeSession.startTimestamp) / 1000))
    : 0;

  const todaySavedSeconds = state.entries
    .filter((e) => e.date === todayStr)
    .reduce((acc, item) => acc + Math.max(0, item.durationSeconds), 0);

  const weekSavedSeconds = state.entries.reduce(
    (acc, item) => acc + Math.max(0, item.durationSeconds),
    0
  );

  const handleStart = () => {
    const now = new Date();
    const dStr = toDateString(now);

    setNowMs(now.getTime());
    setState((prev) => ({
      ...prev,
      activeSession: {
        isRunning: true,
        startTimestamp: now.getTime(),
        startTimeFormatted: toTimeString(now),
        date: dStr,
      },
    }));
  };

  const handleStop = () => {
    const now = new Date();
    const todayDateStr = toDateString(now);

    setNowMs(now.getTime());
    setState((prev) => {
      if (!prev.activeSession?.isRunning) return prev;

      const durationSec = Math.max(
        1,
        Math.floor((now.getTime() - prev.activeSession.startTimestamp) / 1000)
      );

      const sessionDate = prev.activeSession.date || todayDateStr;
      const newEntry: WorkEntry = {
        id: `entry-${now.getTime()}`,
        date: sessionDate,
        startTime: prev.activeSession.startTimeFormatted,
        endTime: toTimeString(now),
        durationSeconds: durationSec,
      };

      const nextState = addEntryToState(prev, newEntry);
      return {
        ...nextState,
        activeSession: null,
      };
    });
  };

  const handleUpdateHourlyRate = (newRate: number) => {
    if (!Number.isFinite(newRate) || newRate <= 0) return;
    setState((prev) => ({
      ...prev,
      hourlyRate: newRate,
    }));
  };

  const handleUpdateDailyTarget = (newTargetHours: number) => {
    if (!Number.isFinite(newTargetHours) || newTargetHours < 0.5 || newTargetHours > 24) return;
    setState((prev) => ({
      ...prev,
      dailyTargetHours: newTargetHours,
    }));
  };

  const handleUpdateEntry = (updated: WorkEntry) => {
    setState((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => (e.id === updated.id ? updated : e)),
    }));
  };

  const handleDeleteEntry = (entry: WorkEntry) => {
    setLastDeletedEntry(entry);
    setState((prev) => ({
      ...prev,
      entries: prev.entries.filter((e) => e.id !== entry.id),
    }));
  };

  const handleUndoDelete = () => {
    if (!lastDeletedEntry) return;
    const restored = lastDeletedEntry;
    setLastDeletedEntry(null);
    setState((prev) => addEntryToState(prev, restored));
  };

  const handleAddEntry = (entryData: Omit<WorkEntry, 'id'>) => {
    const newEntry: WorkEntry = {
      ...entryData,
      id: `manual-${Date.now()}`,
    };
    setState((prev) => addEntryToState(prev, newEntry));
  };

  const handleRolloverCurrentWeek = () => {
    setState((prev) => {
      if (prev.entries.length === 0) return prev;
      const summary = summarizeWeekEntries(prev.currentWeekKey, prev.entries, prev.hourlyRate);
      const archiveEntry = prev.archivedWeeks.some((w) => w.weekKey === summary.weekKey)
        ? {
            ...summary,
            weekKey: `${summary.weekKey}-zapis-${Date.now().toString().slice(-3)}`,
          }
        : summary;

      const updatedArchive = archiveWeekWithCap(
        prev.archivedWeeks,
        archiveEntry,
        MAX_ARCHIVED_WEEKS
      );

      return {
        ...prev,
        entries: [],
        archivedWeeks: updatedArchive,
      };
    });
  };

  return (
    <div
      id="top"
      className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors"
    >
      <Header
        isDark={isDark}
        isRunning={Boolean(state.activeSession?.isRunning)}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onOpenAddModal={() => {
          setModalInitialDate(todayStr);
          setIsEntryModalOpen(true);
        }}
      />

      <main className="flex-1 max-w-[920px] w-full mx-auto px-3.5 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 min-w-0">
        <SessionTimer
          activeSession={state.activeSession}
          elapsedSeconds={elapsedSeconds}
          todaySavedSeconds={todaySavedSeconds}
          weekSavedSeconds={weekSavedSeconds}
          hourlyRate={state.hourlyRate}
          dailyTargetHours={state.dailyTargetHours}
          onStart={handleStart}
          onStop={handleStop}
          onUpdateHourlyRate={handleUpdateHourlyRate}
          onUpdateDailyTarget={handleUpdateDailyTarget}
        />

        <WeeklyChart
          currentWeekKey={state.currentWeekKey}
          entries={state.entries}
          activeSession={state.activeSession}
          elapsedSeconds={elapsedSeconds}
          hourlyRate={state.hourlyRate}
          dailyTargetHours={state.dailyTargetHours}
          todayStr={todayStr}
          onRolloverCurrentWeek={handleRolloverCurrentWeek}
          onSelectDayToAdd={(dateStr) => {
            setModalInitialDate(dateStr);
            setIsEntryModalOpen(true);
          }}
        />

        <WorkEntriesList
          entries={state.entries}
          hourlyRate={state.hourlyRate}
          onUpdateEntry={handleUpdateEntry}
          onDeleteEntry={handleDeleteEntry}
          onOpenAddModal={() => {
            setModalInitialDate(todayStr);
            setIsEntryModalOpen(true);
          }}
        />

        <WeeksArchive archivedWeeks={state.archivedWeeks} />
      </main>

      {lastDeletedEntry && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white text-xs font-medium shadow-lg border border-zinc-700"
        >
          <span>Usunięto wpis ({formatDateWithWeekday(lastDeletedEntry.date)})</span>
          <button
            type="button"
            onClick={handleUndoDelete}
            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Cofnij</span>
          </button>
        </div>
      )}

      <EntryModal
        isOpen={isEntryModalOpen}
        initialDate={modalInitialDate}
        hourlyRate={state.hourlyRate}
        onClose={() => setIsEntryModalOpen(false)}
        onAddEntry={handleAddEntry}
      />
    </div>
  );
}
