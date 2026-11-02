import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_HOURLY_RATE,
  DEFAULT_DAILY_TARGET_HOURS,
  MAX_ARCHIVED_WEEKS,
  calculateEarnings,
  getWeekBounds,
  archiveWeekWithCap,
  checkAndRolloverWeek,
  addEntryToState,
  computeDurationFromTimes,
  createEmptyState,
  formatHMS,
  formatHourlyRate,
  formatDateWithWeekday,
  parseHourlyRateInput,
  parseDailyTargetInput,
  buildEntriesCsv,
  type ArchivedWeek,
  type AppStorageState,
} from './workTime.ts';

test('createEmptyState zaczyna z pustą listą wpisów i domyślnymi ustawieniami', () => {
  const state = createEmptyState(new Date(2026, 10, 2, 10, 0, 0));
  assert.equal(state.entries.length, 0);
  assert.equal(state.archivedWeeks.length, 0);
  assert.equal(state.activeSession, null);
  assert.equal(state.hourlyRate, DEFAULT_HOURLY_RATE);
  assert.equal(state.dailyTargetHours, DEFAULT_DAILY_TARGET_HOURS);
});

test('calculateEarnings poprawnie przelicza przepracowany czas na złotówki', () => {
  assert.equal(calculateEarnings(3600, DEFAULT_HOURLY_RATE), 31.5);
  assert.equal(calculateEarnings(8 * 3600, DEFAULT_HOURLY_RATE), 252.0);
  assert.equal(calculateEarnings(40 * 3600, DEFAULT_HOURLY_RATE), 1260.0);
  assert.equal(calculateEarnings(1800, DEFAULT_HOURLY_RATE), 15.75);
});

test('getWeekBounds wyznacza tydzień poniedziałek–niedziela również dla niedzieli', () => {
  const sun = new Date(2026, 10, 1, 12, 0, 0);
  const bounds = getWeekBounds(sun);
  assert.equal(bounds.monday, '2026-10-26');
  assert.equal(bounds.sunday, '2026-11-01');

  const mon = new Date(2026, 10, 2, 9, 0, 0);
  const nextBounds = getWeekBounds(mon);
  assert.equal(nextBounds.monday, '2026-11-02');
  assert.equal(nextBounds.sunday, '2026-11-08');
});

test('archiveWeekWithCap trzyma maks. 5 tygodni i usuwa najstarszy przy 6. wpisie', () => {
  const makeWeek = (monday: string, sunday: string): ArchivedWeek => ({
    weekKey: monday,
    startDate: monday,
    endDate: sunday,
    totalSeconds: 36000,
    totalEarnings: 315,
    entriesCount: 5,
  });

  const archive5 = [
    makeWeek('2026-10-26', '2026-11-01'),
    makeWeek('2026-10-19', '2026-10-25'),
    makeWeek('2026-10-12', '2026-10-18'),
    makeWeek('2026-10-05', '2026-10-11'),
    makeWeek('2026-09-28', '2026-10-04'),
  ];
  const after6th = archiveWeekWithCap(archive5, makeWeek('2026-11-02', '2026-11-08'));

  assert.equal(MAX_ARCHIVED_WEEKS, 5);
  assert.equal(after6th.length, 5);
  assert.equal(after6th[0].weekKey, '2026-11-02');
  assert.equal(after6th.some((w) => w.weekKey === '2026-09-28'), false);
});

test('checkAndRolloverWeek archiwizuje zakończony tydzień i czyści wpisy bieżącego', () => {
  const initialState: AppStorageState = {
    hourlyRate: 31.5,
    dailyTargetHours: 8,
    currentWeekKey: '2026-10-26',
    entries: [
      {
        id: '1',
        date: '2026-10-27',
        startTime: '08:00',
        endTime: '16:00',
        durationSeconds: 8 * 3600,
      },
    ],
    archivedWeeks: [],
    activeSession: null,
  };

  const nextMonday = new Date(2026, 10, 2, 10, 0, 0);
  const rolled = checkAndRolloverWeek(initialState, nextMonday);

  assert.equal(rolled.currentWeekKey, '2026-11-02');
  assert.equal(rolled.entries.length, 0);
  assert.equal(rolled.archivedWeeks.length, 1);
  assert.equal(rolled.archivedWeeks[0].weekKey, '2026-10-26');
  assert.equal(rolled.archivedWeeks[0].totalEarnings, 252);
});

test('addEntryToState dopisuje wpis z poprzedniego tygodnia do archiwum zamiast do bieżącego', () => {
  const rolledState: AppStorageState = {
    hourlyRate: 40,
    dailyTargetHours: 8,
    currentWeekKey: '2026-11-02',
    entries: [],
    archivedWeeks: [
      {
        weekKey: '2026-10-26',
        startDate: '2026-10-26',
        endDate: '2026-11-01',
        totalSeconds: 3600,
        totalEarnings: 40,
        entriesCount: 1,
      },
    ],
    activeSession: null,
  };

  const updated = addEntryToState(rolledState, {
    id: 'sunday-night',
    date: '2026-11-01',
    startTime: '22:00',
    endTime: '00:00',
    durationSeconds: 7200,
  });

  assert.equal(updated.entries.length, 0);
  assert.equal(updated.archivedWeeks[0].totalSeconds, 10800);
  assert.equal(updated.archivedWeeks[0].totalEarnings, 120);
  assert.equal(updated.archivedWeeks[0].entriesCount, 2);
});

test('computeDurationFromTimes obsługuje zmiany dzienne i nocne', () => {
  const dayDur = computeDurationFromTimes('08:00', '16:30');
  assert.equal(dayDur, 8.5 * 3600);
  assert.equal(formatHMS(dayDur), '08:30:00');

  const nightDur = computeDurationFromTimes('22:00', '06:00');
  assert.equal(nightDur, 8 * 3600);
});

test('parsowanie stawki, celu dziennego i format daty działają poprawnie', () => {
  assert.equal(parseHourlyRateInput('31,50'), 31.5);
  assert.equal(parseHourlyRateInput('45.75'), 45.75);
  assert.equal(parseHourlyRateInput('0'), null);
  assert.equal(parseHourlyRateInput('-10'), null);
  assert.equal(parseDailyTargetInput('7,5'), 7.5);
  assert.equal(parseDailyTargetInput('25'), null);
  assert.ok(formatHourlyRate(45.5).includes('45,50'));
  assert.equal(formatDateWithWeekday('2026-11-25'), 'Śr, 25.11');
});

test('buildEntriesCsv generuje poprawny CSV z ochroną przed formułami', () => {
  const csv = buildEntriesCsv(
    [
      {
        id: '1',
        date: '2026-11-25',
        startTime: '08:00',
        endTime: '12:00',
        durationSeconds: 4 * 3600,
        note: '=CMD()";test',
      },
    ],
    35
  );
  assert.ok(csv.startsWith('\uFEFFData;Od;Do;'));
  assert.ok(csv.includes('2026-11-25;08:00;12:00;240;35,00;140,00;"\'=CMD()"";test"'));
});
