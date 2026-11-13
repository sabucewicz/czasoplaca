import React, { useState } from 'react';
import { Play, Square, Pencil, Check, X } from 'lucide-react';
import {
  formatHMS,
  formatPLN,
  formatDurationHM,
  formatHourlyRate,
  parseHourlyRateInput,
  calculateEarnings,
  type ActiveSession,
} from '../utils/timeLogic';

interface TimerHeroProps {
  activeSession: ActiveSession | null;
  elapsedSeconds: number;
  todaySavedSeconds: number;
  weekSavedSeconds: number;
  hourlyRate: number;
  onStart: () => void;
  onStop: () => void;
  onUpdateHourlyRate: (newRate: number) => void;
}

export const TimerHero: React.FC<TimerHeroProps> = ({
  activeSession,
  elapsedSeconds,
  todaySavedSeconds,
  weekSavedSeconds,
  hourlyRate,
  onStart,
  onStop,
  onUpdateHourlyRate,
}) => {
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('');
  const [rateError, setRateError] = useState(false);

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

  const handleCancelRate = () => {
    setIsEditingRate(false);
    setRateError(false);
  };
  const isRunning = Boolean(activeSession?.isRunning);
  const totalTodaySeconds = todaySavedSeconds + (isRunning ? elapsedSeconds : 0);
  const totalWeekSeconds = weekSavedSeconds + (isRunning ? elapsedSeconds : 0);

  const sessionEarnings = calculateEarnings(isRunning ? elapsedSeconds : 0, hourlyRate);
  const todayEarnings = calculateEarnings(totalTodaySeconds, hourlyRate);
  const weekEarnings = calculateEarnings(totalWeekSeconds, hourlyRate);

  const dailyTargetSeconds = 8 * 3600;
  const progressPercent = Math.min(100, Math.round((totalTodaySeconds / dailyTargetSeconds) * 100));

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <section
      id="stoper"
      aria-label="Stoper czasu pracy"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 transition-colors overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 items-center">
        {/* Left: Live Clock & Start/Stop Button */}
        <div className="md:col-span-7 space-y-4 sm:space-y-5 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">
              {isRunning
                ? `W trakcie (od ${activeSession?.startTimeFormatted})`
                : 'Gotowy do startu'}
            </span>
            {isEditingRate ? (
              <form
                onSubmit={handleSaveRate}
                className="inline-flex items-center gap-1.5 shrink-0"
              >
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
                    if (e.key === 'Escape') handleCancelRate();
                  }}
                  placeholder="np. 35,00"
                  className={`w-20 px-2 py-1 text-xs font-mono-tabular font-semibold rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none ${
                    rateError
                      ? 'border-rose-500 ring-1 ring-rose-500'
                      : 'border-emerald-500 dark:border-emerald-500'
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
                  onClick={handleCancelRate}
                  aria-label="Anuluj edycję stawki"
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={openRateEditor}
                data-testid="hourly-rate-button"
                aria-label="Zmień stawkę godzinową"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono-tabular transition-colors cursor-pointer shrink-0"
              >
                <span>Stawka: {formatHourlyRate(hourlyRate)}</span>
                <Pencil className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-2 sm:gap-4 min-w-0">
            <div
              data-testid="live-timer-display"
              className="text-3xl sm:text-5xl font-bold font-mono-tabular tracking-tight text-slate-900 dark:text-white"
            >
              {formatHMS(isRunning ? elapsedSeconds : 0)}
            </div>

            <div
              data-testid="live-session-earnings"
              className="text-xl sm:text-3xl font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400"
            >
              +{formatPLN(sessionEarnings)}
            </div>
          </div>

          <div>
            {!isRunning ? (
              <button
                type="button"
                onClick={onStart}
                className="w-full inline-flex items-center justify-center gap-2.5 px-4 sm:px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
                <span>Start</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStop}
                className="w-full inline-flex items-center justify-center gap-2.5 px-4 sm:px-6 py-3.5 text-sm sm:text-base font-semibold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
              >
                <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Clean Graphical Ring + Today & Week Totals */}
        <div className="md:col-span-5 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-6 flex items-center gap-4 sm:gap-5 min-w-0">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="10"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#10B981"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
              <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                Dziś
              </span>
              <span className="text-xs sm:text-sm font-bold font-mono-tabular text-slate-900 dark:text-white">
                {formatDurationHM(totalTodaySeconds)}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 sm:space-y-3 flex-1 min-w-0">
            <div className="min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Dzisiaj zarobione
              </div>
              <div
                data-testid="today-total-earnings"
                className="text-lg sm:text-xl font-bold font-mono-tabular text-slate-900 dark:text-white truncate"
              >
                {formatPLN(todayEarnings)}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 min-w-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Ten tydzień (Pon–Niedz)
              </div>
              <div
                data-testid="week-live-earnings"
                className="text-lg sm:text-xl font-bold font-mono-tabular text-emerald-600 dark:text-emerald-400 truncate"
              >
                {formatPLN(weekEarnings)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular truncate">
                {formatDurationHM(totalWeekSeconds)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
