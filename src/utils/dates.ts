import type { Frequency, Habit } from '../types';

/** Local-timezone ISO date key: YYYY-MM-DD. */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(now: Date = new Date()): string {
  return dateKey(now);
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map((p) => parseInt(p, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function yesterdayKey(now: Date = new Date()): string {
  return dateKey(addDays(now, -1));
}

/** Is the habit scheduled ("due") on the given date? */
export function isDueOn(frequency: Frequency, date: Date): boolean {
  switch (frequency.type) {
    case 'daily':
      return true;
    case 'weekly':
      // Weekly habits can be done any day; the target is times-per-week.
      return true;
    case 'specificDays':
      return frequency.days.includes(date.getDay());
  }
}

export function isDueToday(habit: Habit, now: Date = new Date()): boolean {
  return isDueOn(habit.frequency, now);
}

/** Start of the ISO-ish week (Monday) containing the date. */
export function weekStart(d: Date): Date {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = copy.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDays(copy, diff);
}

export function frequencyLabel(frequency: Frequency): string {
  switch (frequency.type) {
    case 'daily':
      return 'EVERY CYCLE';
    case 'weekly':
      return `${frequency.timesPerWeek}× PER WEEK`;
    case 'specificDays': {
      const names = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      return frequency.days
        .slice()
        .sort((a, b) => a - b)
        .map((d) => names[d] ?? '?')
        .join(' · ');
    }
  }
}
