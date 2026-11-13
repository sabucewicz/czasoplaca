import React, { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import {
  calculateEarnings,
  formatPLN,
  formatDurationHM,
  formatDateWithWeekday,
  computeDurationFromTimes,
  type WorkEntry,
} from '../utils/workTime';

interface WorkEntriesListProps {
  entries: WorkEntry[];
  hourlyRate: number;
  onUpdateEntry: (updated: WorkEntry) => void;
  onDeleteEntry: (entry: WorkEntry) => void;
  onOpenAddModal: () => void;
}

export const WorkEntriesList: React.FC<WorkEntriesListProps> = ({
  entries,
  hourlyRate,
  onUpdateEntry,
  onDeleteEntry,
  onOpenAddModal,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editMinutes, setEditMinutes] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editError, setEditError] = useState('');

  const sortedEntries = [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.startTime < b.startTime ? 1 : -1;
  });

  const startEditing = (entry: WorkEntry) => {
    setEditingId(entry.id);
    setEditDate(entry.date);
    setEditStart(entry.startTime);
    setEditEnd(entry.endTime);
    setEditHours(String(Math.floor(entry.durationSeconds / 3600)));
    setEditMinutes(String(Math.floor((entry.durationSeconds % 3600) / 60)));
    setEditNote(entry.note ?? '');
    setEditError('');
  };

  const handleTimeRangeChange = (newStart: string, newEnd: string) => {
    setEditStart(newStart);
    setEditEnd(newEnd);
    setEditError('');
    const dur = computeDurationFromTimes(newStart, newEnd);
    if (dur > 0) {
      setEditHours(String(Math.floor(dur / 3600)));
      setEditMinutes(String(Math.floor((dur % 3600) / 60)));
    }
  };

  const handleSaveEdit = (entry: WorkEntry) => {
    const h = Math.max(0, parseInt(editHours || '0', 10) || 0);
    const m = Math.max(0, Math.min(59, parseInt(editMinutes || '0', 10) || 0));
    const totalSeconds = h * 3600 + m * 60;
    if (!editDate) {
      setEditError('Wybierz datę wpisu.');
      return;
    }
    if (totalSeconds <= 0) {
      setEditError('Czas pracy musi być dłuższy niż 0 min.');
      return;
    }

    const trimmedNote = editNote.trim();
    onUpdateEntry({
      ...entry,
      date: editDate,
      startTime: editStart || '08:00',
      endTime: editEnd || '16:00',
      durationSeconds: totalSeconds,
      note: trimmedNote || undefined,
    });
    setEditingId(null);
    setEditError('');
  };

  return (
    <section
      aria-label="Wpisy w tym tygodniu"
      className="bg-white dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 transition-colors overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white truncate">
          Wpisy w tym tygodniu
        </h2>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer whitespace-nowrap shrink-0"
        >
          + Dodaj wpis
        </button>
      </div>

      {sortedEntries.length === 0 ? (
        <div className="text-center py-8 text-xs text-zinc-500 dark:text-zinc-400">
          Brak zapisanych wpisów w bieżącym tygodniu. Użyj stopera powyżej lub dodaj czas ręcznie.
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
          {sortedEntries.map((entry) => {
            const isEditing = editingId === entry.id;
            const entryEarnings = calculateEarnings(entry.durationSeconds, hourlyRate);

            if (isEditing) {
              return (
                <div
                  key={entry.id}
                  className="py-3 space-y-3 bg-zinc-50 dark:bg-zinc-800/50 px-3 rounded-xl"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      aria-label="Edytuj datę"
                      value={editDate}
                      onChange={(e) => {
                        setEditDate(e.target.value);
                        setEditError('');
                      }}
                      className="px-2.5 py-1.5 text-xs font-mono-tabular border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    />
                    <div className="inline-flex items-center gap-1.5">
                      <input
                        type="time"
                        aria-label="Godzina rozpoczęcia"
                        value={editStart}
                        onChange={(e) => handleTimeRangeChange(e.target.value, editEnd)}
                        className="px-2 py-1.5 text-xs font-mono-tabular border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      />
                      <span className="text-zinc-400">–</span>
                      <input
                        type="time"
                        aria-label="Godzina zakończenia"
                        value={editEnd}
                        onChange={(e) => handleTimeRangeChange(editStart, e.target.value)}
                        className="px-2 py-1.5 text-xs font-mono-tabular border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="inline-flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        aria-label="Godziny"
                        value={editHours}
                        onChange={(e) => {
                          setEditHours(e.target.value);
                          setEditError('');
                        }}
                        className="w-12 px-2 py-1.5 text-xs font-mono-tabular text-right border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      />
                      <span className="text-xs text-zinc-400">h</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        aria-label="Minuty"
                        value={editMinutes}
                        onChange={(e) => {
                          setEditMinutes(e.target.value);
                          setEditError('');
                        }}
                        className="w-12 px-2 py-1.5 text-xs font-mono-tabular text-right border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                      />
                      <span className="text-xs text-zinc-400">m</span>
                    </div>
                  </div>

                  <input
                    type="text"
                    maxLength={80}
                    aria-label="Notatka do wpisu"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Notatka (opcjonalnie, np. zmiana popołudniowa)"
                    className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />

                  {editError && (
                    <p className="text-xs text-rose-600 dark:text-rose-400">{editError}</p>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(entry)}
                      aria-label={`Zapisz zmiany z ${entry.date}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Zapisz</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditError('');
                      }}
                      aria-label="Anuluj"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Anuluj</span>
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={entry.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0">
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                      <span
                        title={entry.date}
                        className="font-mono-tabular font-semibold text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm whitespace-nowrap"
                      >
                        {formatDateWithWeekday(entry.date)}
                      </span>
                      <span className="font-mono-tabular text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {entry.startTime} – {entry.endTime}
                      </span>
                    </div>

                    <div className="flex sm:hidden items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditing(entry)}
                        aria-label={`Edytuj wpis z dnia ${entry.date}`}
                        className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry)}
                        aria-label={`Usuń wpis z dnia ${entry.date}`}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {entry.note && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {entry.note}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-5 shrink-0">
                  <span className="font-mono-tabular text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                    {formatDurationHM(entry.durationSeconds)}
                  </span>
                  <span className="font-mono-tabular text-sm font-bold text-emerald-600 dark:text-emerald-400 sm:min-w-[84px] text-right whitespace-nowrap">
                    {formatPLN(entryEarnings)}
                  </span>

                  <div className="hidden sm:flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditing(entry)}
                      aria-label={`Edytuj wpis z dnia ${entry.date}`}
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry)}
                      aria-label={`Usuń wpis z dnia ${entry.date}`}
                      className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
