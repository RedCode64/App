import type { GlobalStreak, Habit } from '../types';
import { addDays, dateKey, parseKey, weekStart, yesterdayKey } from './dates';

/** Escalating flat XP bonus for longer habit streaks. */
export function streakBonusXp(streak: number): number {
  if (streak >= 30) return 30;
  if (streak >= 14) return 20;
  if (streak >= 7) return 12;
  if (streak >= 3) return 5;
  return 0;
}

/**
 * Current streak for a single habit, respecting its frequency.
 * - daily: consecutive calendar days ending today or yesterday.
 * - specificDays: consecutive scheduled days.
 * - weekly: consecutive weeks (including the current one) meeting the target.
 */
export function habitStreak(habit: Habit, now: Date = new Date()): number {
  const done = new Set(habit.completedDates);
  if (done.size === 0) return 0;

  if (habit.frequency.type === 'weekly') {
    const target = Math.max(1, habit.frequency.timesPerWeek);
    let streak = 0;
    let cursor = weekStart(now);
    // The in-progress week counts if it has already met the target.
    const countInWeek = (start: Date): number => {
      let c = 0;
      for (let i = 0; i < 7; i++) {
        if (done.has(dateKey(addDays(start, i)))) c += 1;
      }
      return c;
    };
    if (countInWeek(cursor) >= target) streak += 1;
    cursor = addDays(cursor, -7);
    while (countInWeek(cursor) >= target) {
      streak += 1;
      cursor = addDays(cursor, -7);
    }
    return streak;
  }

  const scheduled = (d: Date): boolean =>
    habit.frequency.type === 'specificDays' ? habit.frequency.days.includes(d.getDay()) : true;

  let streak = 0;
  let cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Today only breaks the streak if it was scheduled and missed — but since the
  // day isn't over, an incomplete today is skipped rather than counted as a miss.
  if (scheduled(cursor) && done.has(dateKey(cursor))) {
    streak += 1;
  }
  cursor = addDays(cursor, -1);
  for (let guard = 0; guard < 730; guard++) {
    if (scheduled(cursor)) {
      if (done.has(dateKey(cursor))) streak += 1;
      else break;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export interface StreakEvaluation {
  streak: GlobalStreak;
  shieldsConsumed: number;
  broken: boolean;
}

/**
 * Day-rollover evaluation of the account-wide streak. If the last completion
 * day is before yesterday, the streak breaks — unless a streak shield absorbs
 * the missed gap (one shield covers the whole gap, then the streak may
 * continue with today's completions).
 */
export function evaluateGlobalStreak(streak: GlobalStreak, shields: number, now: Date = new Date()): StreakEvaluation {
  if (streak.count === 0 || streak.lastDate === null) {
    return { streak, shieldsConsumed: 0, broken: false };
  }
  const yKey = yesterdayKey(now);
  const tKey = dateKey(now);
  if (streak.lastDate >= yKey || streak.lastDate === tKey) {
    return { streak, shieldsConsumed: 0, broken: false };
  }
  if (shields > 0) {
    // Shield burns: pretend the runner checked in yesterday so today continues the chain.
    return {
      streak: { ...streak, lastDate: yKey },
      shieldsConsumed: 1,
      broken: false,
    };
  }
  return {
    streak: { count: 0, lastDate: null, best: streak.best },
    shieldsConsumed: 0,
    broken: true,
  };
}

/** Advance the global streak for a completion happening "today". */
export function advanceGlobalStreak(streak: GlobalStreak, now: Date = new Date()): GlobalStreak {
  const tKey = dateKey(now);
  if (streak.lastDate === tKey) return streak;
  const yKey = yesterdayKey(now);
  const count = streak.lastDate === yKey ? streak.count + 1 : 1;
  return { count, lastDate: tKey, best: Math.max(streak.best, count) };
}

/** Days in the current streak of a parsed date range (used by the calendar grid). */
export function completionsInMonth(habits: Habit[], year: number, month: number): Map<string, number> {
  const map = new Map<string, number>();
  const prefix = `${year}-${`${month + 1}`.padStart(2, '0')}`;
  for (const habit of habits) {
    for (const key of habit.completedDates) {
      if (key.startsWith(prefix)) {
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    }
  }
  return map;
}

export function isCompletedOn(habit: Habit, key: string): boolean {
  return habit.completedDates.includes(key);
}

export function lastNDaysKeys(n: number, now: Date = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(dateKey(addDays(now, -i)));
  }
  return keys;
}

export function firstKeyOfMonth(year: number, month: number): Date {
  return parseKey(`${year}-${`${month + 1}`.padStart(2, '0')}-01`);
}
