import React, { useState } from 'react';
import { Play, Square, Pencil, Check, X } from 'lucide-react';
import {
  formatHMS,
  formatPLN,
  formatDurationHM,
  formatHourlyRate,
  parseHourlyRateInput,
  parseDailyTargetInput,
  calculateEarnings,
  type ActiveSession,
} from '../utils/workTime';

interface SessionTimerProps {
  activeSession: ActiveSession | null;
  elapsedSeconds: number;
  todaySavedSeconds: number;
  weekSavedSeconds: number;
  hourlyRate: number;
  dailyTargetHours: number;
  onStart: () => void;
  onStop: () => void;
  onUpdateHourlyRate: (newRate: number) => void;
  onUpdateDailyTarget: (newTargetHours: number) => void;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({
  activeSession,
  elapsedSeconds,
  todaySavedSeconds,
  weekSavedSeconds,
  hourlyRate,
  dailyTargetHours,
  onStart,
  onStop,
  onUpdateHourlyRate,
  onUpdateDailyTarget,
}) => {
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('');
  const [rateError, setRateError] = useState(false);

  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [targetError, setTargetError] = useState(false);

  const openRateEditor = () => {
    setRateInput(hourlyRate.toFixed(2).replace('.', ','));
    setRateError(false);
    setIsEditingRate(true);
  };

  const handleSaveRate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseHourlyRateInput(rateInput);
    if (parsed === null) {
      setRateError(true);
      return;
    }
    onUpdateHourlyRate(parsed);
    setIsEditingRate(false);
    setRateError(false);
  };

  const openTargetEditor = () => {
    setTargetInput(String(dailyTargetHours).replace('.', ','));
    setTargetError(false);
    setIsEditingTarget(true);
  };

  const handleSaveTarget = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseDailyTargetInput(targetInput);
    if (parsed === null) {
      setTargetError(true);
      return;
    }
    onUpdateDailyTarget(parsed);
    setIsEditingTarget(false);
    setTargetError(false);
  };

  const isRunning = Boolean(activeSession?.isRunning);
  const totalTodaySeconds = todaySavedSeconds + (isRunning ? elapsedSeconds : 0);
  const totalWeekSeconds = weekSavedSeconds + (isRunning ? elapsedSeconds : 0);

  const sessionEarnings = calculateEarnings(isRunning ? elapsedSeconds : 0, hourlyRate);
  const todayEarnings = calculateEarnings(totalTodaySeconds, hourlyRate);
  const weekEarnings = calculateEarnings(totalWeekSeconds, hourlyRate);

  const dailyTargetSeconds = Math.max(1800, dailyTargetHours * 3600);
  const rawProgress = Math.round((totalTodaySeconds / dailyTargetSeconds) * 100);
  const barWidthPct = Math.min(100, rawProgress);

  return (
    <section
      id="stoper"
      aria-label="Stoper czasu pracy"
      className="bg-white dark:bg-zinc-900/90 border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl p-4 sm:p-6 transition-colors overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        <div className="md:col-span-7 flex flex-col justify-between space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="truncate font-medium">
              {isRunning
                ? `Start sesji: ${activeSession?.startTimeFormatted}`
                : 'Licznik czasu pracy'}
            </span>

            {isEditingRate ? (
              <form onSubmit={handleSaveRate} className="inline-flex items-center gap-1.5 shrink-0">
                <label htmlFor="hourly-rate-input" className="sr-only">
                  Stawka godzinowa (zł/h)
                </label>
                <input
                  id="hourly-rate-input"
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  value={rateInput}
                  onChange={(e) => {
                    setRateInput(e.target.value);
                    if (rateError) setRateError(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsEditingRate(false);
                      setRateError(false);
                    }
                  }}
                  placeholder="np. 35,00"
                  className={`w-20 px-2 py-1 text-xs font-mono-tabular font-semibold rounded-lg border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none ${
                    rateError
                      ? 'border-rose-500 ring-1 ring-rose-500'
                      : 'border-emerald-500'
                  }`}
                />
                <span className="text-xs font-mono-tabular">zł/h</span>
                <button
                  type="submit"
                  aria-label="Zapisz stawkę"
                  className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-md cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingRate(false);
                    setRateError(false);
                  }}
                  aria-label="Anuluj edycję stawki"
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={openRateEditor}
                aria-label="Zmień stawkę godzinową"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-mono-tabular transition-colors cursor-pointer shrink-0"
              >
                <span>Stawka: {formatHourlyRate(hourlyRate)}</span>
                <Pencil className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-2 sm:gap-4 min-w-0 py-1">
            <div className="text-3xl sm:text-5xl font-bold font-mono-tabular tracking-tight text-zinc-900 dark:text-white">
              {formatHMS(isRunning ? elapsedSeconds : 0)}
            </div>

            <div
              className={`text-lg sm:text-3xl font-bold font-mono-tabular ${
                isRunning
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-zinc-400 dark:text-zinc-500'
              }`}
            >
              +{formatPLN(sessionEarnings)}
            </div>
          </div>

          <div>
            {!isRunning ? (
              <button
                type="button"
                onClick={onStart}
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 text-sm sm:text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
                <span>Start sesji</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStop}
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 text-sm sm:text-base font-semibold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
                <span>Stop i zapisz</span>
              </button>
            )}
          </div>
        </div>

        <div className="md:col-span-5 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-zinc-200/80 dark:border-zinc-800 md:pl-6 flex flex-col justify-between gap-4 min-w-0">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>Dzisiaj</span>
              {isEditingTarget ? (
                <form onSubmit={handleSaveTarget} className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    aria-label="Cel dzienny (godziny)"
                    value={targetInput}
                    onChange={(e) => {
                      setTargetInput(e.target.value);
                      if (targetError) setTargetError(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsEditingTarget(false);
                        setTargetError(false);
                      }
                    }}
                    className={`w-12 px-1.5 py-0.5 text-xs font-mono-tabular rounded border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none ${
                      targetError ? 'border-rose-500' : 'border-emerald-500'
                    }`}
                  />
                  <span>h</span>
                  <button
                    type="submit"
                    aria-label="Zapisz cel dzienny"
                    className="p-0.5 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={openTargetEditor}
                  className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors cursor-pointer font-mono-tabular"
                  title="Zmień cel dzienny"
                >
                  <span>Cel: {dailyTargetHours}h ({rawProgress}%)</span>
                  <Pencil className="w-2.5 h-2.5 text-zinc-400" />
                </button>
              )}
            </div>

            <div className="flex items-baseline justify-between gap-3">
              <div className="text-xs font-mono-tabular text-zinc-500 dark:text-zinc-400 shrink-0">
                {formatDurationHM(totalTodaySeconds)}
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono-tabular text-zinc-900 dark:text-white truncate">
                {formatPLN(todayEarnings)}
              </div>
            </div>

            <div
              className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden"
              role="progressbar"
              aria-valuenow={barWidthPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Postęp dziennego celu czasu pracy"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  rawProgress >= 100 ? 'bg-emerald-500' : 'bg-emerald-600 dark:bg-emerald-500'
                }`}
                style={{ width: `${barWidthPct}%` }}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800 flex items-baseline justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Ten tydzień</div>
              <div className="text-xs font-mono-tabular text-zinc-500 dark:text-zinc-400 mt-0.5">
                {formatDurationHM(totalWeekSeconds)}
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400 truncate">
              {formatPLN(weekEarnings)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
