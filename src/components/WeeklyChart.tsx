import React, { useState } from 'react';
import { RotateCcw, Download } from 'lucide-react';
import {
  getWeekDays,
  calculateEarnings,
  formatPLN,
  formatDurationHM,
  buildEntriesCsv,
  type WorkEntry,
  type ActiveSession,
} from '../utils/workTime';

interface WeeklyChartProps {
  currentWeekKey: string;
  entries: WorkEntry[];
  activeSession: ActiveSession | null;
  elapsedSeconds: number;
  hourlyRate: number;
  dailyTargetHours: number;
  todayStr: string;
  onRolloverCurrentWeek: () => void;
  onSelectDayToAdd: (dateStr: string) => void;
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({
  currentWeekKey,
  entries,
  activeSession,
  elapsedSeconds,
  hourlyRate,
  dailyTargetHours,
  todayStr,
  onRolloverCurrentWeek,
  onSelectDayToAdd,
}) => {
  const [confirmRollover, setConfirmRollover] = useState(false);
  const weekDays = getWeekDays(currentWeekKey);
  const firstDay = weekDays[0]?.dayMonthLabel || '';
  const lastDay = weekDays[6]?.dayMonthLabel || '';

  const dayData = weekDays.map((day) => {
    const savedSeconds = entries
      .filter((e) => e.date === day.date)
      .reduce((acc, item) => acc + Math.max(0, item.durationSeconds), 0);

    const liveBonus =
      activeSession?.isRunning && activeSession.date === day.date ? elapsedSeconds : 0;

    const totalSeconds = savedSeconds + liveBonus;
    const earnings = calculateEarnings(totalSeconds, hourlyRate);

    return {
      ...day,
      totalSeconds,
      earnings,
      isToday: day.date === todayStr,
    };
  });

  const targetSeconds = Math.max(3600, dailyTargetHours * 3600);
  const maxDaySeconds = Math.max(targetSeconds, ...dayData.map((d) => d.totalSeconds));
  const targetLineBottomPct = Math.min(95, Math.round((targetSeconds / maxDaySeconds) * 100));

  const handleExportCsv = () => {
    if (entries.length === 0) return;
    const csv = buildEntriesCsv(entries, hourlyRate);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `czasoplaca-${currentWeekKey}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section
      id="tydzien"
      aria-label="Podsumowanie bieżącego tygodnia"
      className="bg-white dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl p-4 sm:p-6 space-y-4 transition-colors overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
            Bieżący tydzień ({firstDay} – {lastDay})
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Kliknij dzień na wykresie, aby dodać wpis
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>CSV</span>
          </button>

          {confirmRollover ? (
            <div className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/70 rounded-lg px-2 py-1">
              <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300">
                Zamknąć tydzień?
              </span>
              <button
                type="button"
                onClick={() => {
                  onRolloverCurrentWeek();
                  setConfirmRollover(false);
                }}
                className="px-2 py-0.5 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded cursor-pointer"
              >
                Tak
              </button>
              <button
                type="button"
                onClick={() => setConfirmRollover(false)}
                className="px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                Nie
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={entries.length === 0}
              onClick={() => setConfirmRollover(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Zamknij tydzień</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-3 items-end h-44 sm:h-48 pt-3 px-1.5 sm:px-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl p-2 sm:p-3 border border-zinc-200/60 dark:border-zinc-800/80">
        {dayData.map((day) => {
          const heightPct =
            day.totalSeconds > 0
              ? Math.max(10, Math.round((day.totalSeconds / maxDaySeconds) * 100))
              : 0;

          const compactHours =
            day.totalSeconds > 0
              ? `${(day.totalSeconds / 3600).toLocaleString('pl-PL', {
                  maximumFractionDigits: 1,
                })}h`
              : '0h';

          const compactPLN =
            day.totalSeconds > 0 ? `${Math.round(day.earnings)} zł` : '—';

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDayToAdd(day.date)}
              aria-label={`${day.dayNameFull} (${day.dayMonthLabel}): ${formatDurationHM(day.totalSeconds)}, ${formatPLN(day.earnings)}`}
              className="group flex flex-col items-center justify-end h-full w-full min-w-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-emerald-500 rounded-lg"
            >
              <div className="hidden sm:block text-[11px] font-mono-tabular font-semibold text-zinc-700 dark:text-zinc-200 mb-0.5 truncate max-w-full">
                {day.totalSeconds > 0 ? formatPLN(day.earnings) : '—'}
              </div>
              <div className="sm:hidden text-[9px] font-mono-tabular font-semibold text-zinc-700 dark:text-zinc-200 mb-0.5 truncate max-w-full">
                {compactPLN}
              </div>

              <div className="hidden sm:block text-[10px] font-mono-tabular text-zinc-400 dark:text-zinc-500 mb-1.5 truncate max-w-full">
                {day.totalSeconds > 0 ? formatDurationHM(day.totalSeconds) : '0h'}
              </div>
              <div className="sm:hidden text-[9px] font-mono-tabular text-zinc-400 dark:text-zinc-500 mb-1 truncate max-w-full">
                {compactHours}
              </div>

              <div className="relative w-full max-w-[38px] sm:max-w-[44px] flex-1 flex items-end bg-zinc-200/70 dark:bg-zinc-800/60 rounded-t-md overflow-hidden">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 border-t border-dashed border-zinc-400/40 dark:border-zinc-600/60 pointer-events-none"
                  style={{ bottom: `${targetLineBottomPct}%` }}
                />
                {day.totalSeconds > 0 && (
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      day.isToday
                        ? 'bg-emerald-500 group-hover:bg-emerald-400'
                        : 'bg-emerald-600/85 dark:bg-emerald-500/80 group-hover:bg-emerald-500'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                )}
              </div>

              <div className="mt-1.5 sm:mt-2 text-center w-full min-w-0">
                <div
                  className={`text-[10px] sm:text-xs font-semibold truncate ${
                    day.isToday
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {day.dayNameShort}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
