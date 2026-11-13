import React from 'react';
import {
  formatPLN,
  formatDurationHM,
  MAX_ARCHIVED_WEEKS,
  type ArchivedWeek,
} from '../utils/workTime';

interface WeeksArchiveProps {
  archivedWeeks: ArchivedWeek[];
}

function formatEntriesLabel(count: number): string {
  if (count === 1) return '1 wpis';
  if (count >= 2 && count <= 4) return `${count} wpisy`;
  return `${count} wpisów`;
}

export const WeeksArchive: React.FC<WeeksArchiveProps> = ({ archivedWeeks }) => {
  const visibleWeeks = archivedWeeks.slice(0, MAX_ARCHIVED_WEEKS);

  return (
    <section
      id="archiwum"
      aria-label="Archiwum tygodni"
      className="bg-white dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl p-4 sm:p-6 space-y-4 transition-colors overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
          Archiwum tygodni
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Ostatnie {MAX_ARCHIVED_WEEKS} zamkniętych tygodni
        </span>
      </div>

      {visibleWeeks.length === 0 ? (
        <div className="text-center py-6 text-xs text-zinc-500 dark:text-zinc-400">
          Zamknięte tygodnie pojawią się tutaj automatycznie po zakończeniu tygodnia.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {visibleWeeks.map((week) => (
            <div
              key={week.weekKey}
              className="border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 rounded-xl p-4 space-y-2 min-w-0"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-mono-tabular truncate">
                  {week.startDate.slice(5)} – {week.endDate.slice(5)}
                </span>
                <span className="shrink-0">{formatEntriesLabel(week.entriesCount)}</span>
              </div>

              <div className="text-lg sm:text-xl font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400 truncate">
                {formatPLN(week.totalEarnings)}
              </div>

              <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono-tabular">
                Czas pracy:{' '}
                <strong className="text-zinc-900 dark:text-zinc-200">
                  {formatDurationHM(week.totalSeconds)}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
