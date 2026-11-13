import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  computeDurationFromTimes,
  calculateEarnings,
  formatPLN,
  type WorkEntry,
} from '../utils/workTime';

interface EntryModalProps {
  isOpen: boolean;
  initialDate: string;
  hourlyRate: number;
  onClose: () => void;
  onAddEntry: (entry: Omit<WorkEntry, 'id'>) => void;
}

export const EntryModal: React.FC<EntryModalProps> = ({
  isOpen,
  initialDate,
  hourlyRate,
  onClose,
  onAddEntry,
}) => {
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('16:00');
  const [hours, setHours] = useState('8');
  const [minutes, setMinutes] = useState('0');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDate(initialDate);
      setStartTime('08:00');
      setEndTime('16:00');
      setHours('8');
      setMinutes('0');
      setNote('');
      setFormError('');
    }
  }, [isOpen, initialDate]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTimeChange = (newStart: string, newEnd: string) => {
    setStartTime(newStart);
    setEndTime(newEnd);
    setFormError('');
    const dur = computeDurationFromTimes(newStart, newEnd);
    if (dur > 0) {
      setHours(String(Math.floor(dur / 3600)));
      setMinutes(String(Math.floor((dur % 3600) / 60)));
    }
  };

  const parsedHours = Math.max(0, parseInt(hours || '0', 10) || 0);
  const parsedMinutes = Math.max(0, Math.min(59, parseInt(minutes || '0', 10) || 0));
  const totalSeconds = parsedHours * 3600 + parsedMinutes * 60;
  const previewEarnings = calculateEarnings(totalSeconds, hourlyRate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      setFormError('Wybierz datę pracy.');
      return;
    }
    if (totalSeconds <= 0) {
      setFormError('Czas pracy musi być dłuższy niż 0 minut.');
      return;
    }
    const trimmedNote = note.trim();
    onAddEntry({
      date,
      startTime: startTime || '08:00',
      endTime: endTime || '16:00',
      durationSeconds: totalSeconds,
      note: trimmedNote || undefined,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="entry-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/75 backdrop-blur-xs p-4"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3
            id="entry-modal-title"
            className="text-base font-bold text-zinc-900 dark:text-white"
          >
            Dodaj godziny pracy
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zamknij"
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label
              htmlFor="modal-date"
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
            >
              Data
            </label>
            <input
              id="modal-date"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setFormError('');
              }}
              className="w-full px-3 py-2 text-sm font-mono-tabular border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="modal-start"
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
              >
                Od
              </label>
              <input
                id="modal-start"
                type="time"
                value={startTime}
                onChange={(e) => handleTimeChange(e.target.value, endTime)}
                className="w-full px-3 py-2 text-sm font-mono-tabular border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="modal-end"
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
              >
                Do
              </label>
              <input
                id="modal-end"
                type="time"
                value={endTime}
                onChange={(e) => handleTimeChange(startTime, e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono-tabular border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="modal-hours"
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
              >
                Godziny
              </label>
              <input
                id="modal-hours"
                type="number"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => {
                  setHours(e.target.value);
                  setFormError('');
                }}
                className="w-full px-3 py-2 text-sm font-mono-tabular border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="modal-minutes"
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
              >
                Minuty
              </label>
              <input
                id="modal-minutes"
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => {
                  setMinutes(e.target.value);
                  setFormError('');
                }}
                className="w-full px-3 py-2 text-sm font-mono-tabular border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="modal-note"
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
            >
              Notatka (opcjonalnie)
            </label>
            <input
              id="modal-note"
              type="text"
              maxLength={80}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="np. Zmiana wieczorna, zlecenie"
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
          </div>

          {formError && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{formError}</p>
          )}

          <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Szacowana kwota:</span>
            <span className="text-base font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400">
              {formatPLN(previewEarnings)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl cursor-pointer"
            >
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
