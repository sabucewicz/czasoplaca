export const DEFAULT_HOURLY_RATE = 31.5;
export const DEFAULT_DAILY_TARGET_HOURS = 8;
export const MAX_ARCHIVED_WEEKS = 5;

export interface WorkEntry {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationSeconds: number;
  note?: string;
}

export interface ArchivedWeek {
  weekKey: string; // poniedziałek tygodnia (YYYY-MM-DD)
  startDate: string;
  endDate: string;
  totalSeconds: number;
  totalEarnings: number;
  entriesCount: number;
}

export interface ActiveSession {
  isRunning: boolean;
  startTimestamp: number;
  startTimeFormatted: string;
  date: string;
}

export interface AppStorageState {
  hourlyRate: number;
  dailyTargetHours: number;
  currentWeekKey: string;
  entries: WorkEntry[];
  archivedWeeks: ArchivedWeek[];
  activeSession: ActiveSession | null;
}

const WEEKDAY_SHORT_PL = ['Niedz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];

export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toTimeString(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

export function formatDateWithWeekday(dateStr: string): string {
  const date = parseDateString(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const weekday = WEEKDAY_SHORT_PL[date.getDay()] ?? '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${weekday}, ${dd}.${mm}`;
}

// Tydzień liczony od poniedziałku (1) do niedzieli (0 -> 7)
export function getWeekBounds(date: Date): { monday: string; sunday: string; weekKey: string } {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const mondayDate = new Date(d);
  mondayDate.setDate(d.getDate() + diffToMonday);

  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);

  const monday = toDateString(mondayDate);
  const sunday = toDateString(sundayDate);
  return { monday, sunday, weekKey: monday };
}

export function getWeekDays(weekKey: string): {
  date: string;
  dayNameShort: string;
  dayNameFull: string;
  dayMonthLabel: string;
}[] {
  const shortNames = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Niedz'];
  const fullNames = [
    'Poniedziałek',
    'Wtorek',
    'Środa',
    'Czwartek',
    'Piątek',
    'Sobota',
    'Niedziela',
  ];
  const monday = parseDateString(weekKey);
  return shortNames.map((shortName, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateStr = toDateString(d);
    const dayNum = String(d.getDate()).padStart(2, '0');
    const monthNum = String(d.getMonth() + 1).padStart(2, '0');
    return {
      date: dateStr,
      dayNameShort: shortName,
      dayNameFull: fullNames[idx],
      dayMonthLabel: `${dayNum}.${monthNum}`,
    };
  });
}

export function calculateEarnings(durationSeconds: number, hourlyRate = DEFAULT_HOURLY_RATE): number {
  if (durationSeconds <= 0 || hourlyRate <= 0) return 0;
  const hours = durationSeconds / 3600;
  return Math.round(hours * hourlyRate * 100) / 100;
}

export function formatPLN(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return (
    safeAmount.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' zł'
  );
}

export function formatHourlyRate(rate: number): string {
  const safeRate = Number.isFinite(rate) && rate > 0 ? rate : DEFAULT_HOURLY_RATE;
  return (
    safeRate.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' zł/h'
  );
}

export function parseHourlyRateInput(raw: string): number | null {
  const normalized = raw.trim().replace(/\s+/g, '').replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100000) {
    return null;
  }
  return Math.round(parsed * 100) / 100;
}

export function parseDailyTargetInput(raw: string): number | null {
  const normalized = raw.trim().replace(/\s+/g, '').replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0.5 || parsed > 24) {
    return null;
  }
  return Math.round(parsed * 10) / 10;
}

export function formatHMS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

export function formatDurationHM(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (hours === 0 && minutes === 0 && safe > 0) {
    return `${safe}s`;
  }
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function archiveWeekWithCap(
  existingArchive: ArchivedWeek[],
  newWeek: ArchivedWeek,
  maxWeeks: number = MAX_ARCHIVED_WEEKS
): ArchivedWeek[] {
  const filtered = existingArchive.filter((w) => w.weekKey !== newWeek.weekKey);
  const combined = [newWeek, ...filtered];
  combined.sort((a, b) => (a.weekKey < b.weekKey ? 1 : a.weekKey > b.weekKey ? -1 : 0));
  return combined.slice(0, maxWeeks);
}

export function summarizeWeekEntries(
  weekKey: string,
  entries: WorkEntry[],
  hourlyRate = DEFAULT_HOURLY_RATE
): ArchivedWeek {
  const mondayDate = parseDateString(weekKey);
  const { monday, sunday } = getWeekBounds(mondayDate);
  const totalSeconds = entries.reduce((acc, item) => acc + Math.max(0, item.durationSeconds), 0);
  const totalEarnings = calculateEarnings(totalSeconds, hourlyRate);
  return {
    weekKey: monday,
    startDate: monday,
    endDate: sunday,
    totalSeconds,
    totalEarnings,
    entriesCount: entries.length,
  };
}

export function checkAndRolloverWeek(state: AppStorageState, now: Date): AppStorageState {
  const { weekKey: nowWeekKey } = getWeekBounds(now);
  if (!state.currentWeekKey) {
    return { ...state, currentWeekKey: nowWeekKey };
  }
  if (state.currentWeekKey === nowWeekKey) {
    return state;
  }

  let updatedArchive = state.archivedWeeks;
  if (state.entries.length > 0) {
    const summary = summarizeWeekEntries(state.currentWeekKey, state.entries, state.hourlyRate);
    updatedArchive = archiveWeekWithCap(state.archivedWeeks, summary, MAX_ARCHIVED_WEEKS);
  }

  return {
    ...state,
    currentWeekKey: nowWeekKey,
    entries: [],
    archivedWeeks: updatedArchive,
  };
}

// Wpis z poprzedniego tygodnia (np. nocka niedziela -> poniedziałek) trafia do właściwego tygodnia w archiwum
export function addEntryToState(state: AppStorageState, entry: WorkEntry): AppStorageState {
  const entryDate = parseDateString(entry.date);
  const { monday, sunday, weekKey: entryWeekKey } = getWeekBounds(entryDate);

  if (entryWeekKey === state.currentWeekKey) {
    return {
      ...state,
      entries: [entry, ...state.entries],
    };
  }

  const existing = state.archivedWeeks.find((w) => w.weekKey === entryWeekKey);
  const entrySeconds = Math.max(0, entry.durationSeconds);
  const entryEarnings = calculateEarnings(entrySeconds, state.hourlyRate);

  const mergedWeek: ArchivedWeek = existing
    ? {
        ...existing,
        totalSeconds: existing.totalSeconds + entrySeconds,
        totalEarnings: Math.round((existing.totalEarnings + entryEarnings) * 100) / 100,
        entriesCount: existing.entriesCount + 1,
      }
    : {
        weekKey: monday,
        startDate: monday,
        endDate: sunday,
        totalSeconds: entrySeconds,
        totalEarnings: entryEarnings,
        entriesCount: 1,
      };

  return {
    ...state,
    archivedWeeks: archiveWeekWithCap(state.archivedWeeks, mergedWeek, MAX_ARCHIVED_WEEKS),
  };
}

export function computeDurationFromTimes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (!Number.isFinite(sh) || !Number.isFinite(sm) || !Number.isFinite(eh) || !Number.isFinite(em)) {
    return 0;
  }
  const startMinutes = sh * 60 + sm;
  let endMinutes = eh * 60 + em;
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  return (endMinutes - startMinutes) * 60;
}

// Neutralizuje znaki początkowe mogące uruchamiać formuły w Excelu/Sheets
function escapeCsvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  if (/[;"\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function buildEntriesCsv(entries: WorkEntry[], hourlyRate: number): string {
  const header = ['Data', 'Od', 'Do', 'Czas (min)', 'Stawka (PLN/h)', 'Kwota (PLN)', 'Notatka'];
  const sorted = [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.startTime < b.startTime ? -1 : 1;
  });

  const rows = sorted.map((entry) => {
    const mins = Math.round(Math.max(0, entry.durationSeconds) / 60);
    const earnings = calculateEarnings(entry.durationSeconds, hourlyRate).toFixed(2).replace('.', ',');
    const rate = hourlyRate.toFixed(2).replace('.', ',');
    return [
      escapeCsvCell(entry.date),
      escapeCsvCell(entry.startTime),
      escapeCsvCell(entry.endTime),
      escapeCsvCell(String(mins)),
      escapeCsvCell(rate),
      escapeCsvCell(earnings),
      escapeCsvCell(entry.note?.trim() ?? ''),
    ].join(';');
  });

  return '\uFEFF' + [header.join(';'), ...rows].join('\r\n');
}

export function createEmptyState(now: Date): AppStorageState {
  const { monday: currentMonday } = getWeekBounds(now);

  return {
    hourlyRate: DEFAULT_HOURLY_RATE,
    dailyTargetHours: DEFAULT_DAILY_TARGET_HOURS,
    currentWeekKey: currentMonday,
    entries: [],
    archivedWeeks: [],
    activeSession: null,
  };
}
