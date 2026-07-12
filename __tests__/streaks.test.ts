import type { GlobalStreak, Habit } from '../src/types';
import { addDays, dateKey } from '../src/utils/dates';
import {
  advanceGlobalStreak,
  evaluateGlobalStreak,
  habitStreak,
  streakBonusXp,
} from '../src/utils/streaks';

// Fixed reference date: Friday 2026-01-09 (local time).
const NOW = new Date(2026, 0, 9, 12, 0, 0);

function makeHabit(overrides: Partial<Habit>): Habit {
  return {
    id: 'h1',
    name: 'Test',
    description: '',
    category: 'body',
    frequency: { type: 'daily' },
    createdAt: 0,
    completedDates: [],
    bestStreak: 0,
    ...overrides,
  };
}

function daysAgo(n: number): string {
  return dateKey(addDays(NOW, -n));
}

describe('streak bonus XP escalation', () => {
  it('escalates with streak length', () => {
    expect(streakBonusXp(0)).toBe(0);
    expect(streakBonusXp(2)).toBe(0);
    expect(streakBonusXp(3)).toBe(5);
    expect(streakBonusXp(7)).toBe(12);
    expect(streakBonusXp(14)).toBe(20);
    expect(streakBonusXp(30)).toBe(30);
    expect(streakBonusXp(365)).toBe(30);
  });
});

describe('daily habit streak', () => {
  it('is 0 with no completions', () => {
    expect(habitStreak(makeHabit({}), NOW)).toBe(0);
  });

  it('counts consecutive days ending yesterday (today still pending)', () => {
    const habit = makeHabit({ completedDates: [daysAgo(1), daysAgo(2), daysAgo(3)] });
    expect(habitStreak(habit, NOW)).toBe(3);
  });

  it('includes today when completed', () => {
    const habit = makeHabit({ completedDates: [daysAgo(0), daysAgo(1), daysAgo(2)] });
    expect(habitStreak(habit, NOW)).toBe(3);
  });

  it('breaks on a missed day', () => {
    const habit = makeHabit({ completedDates: [daysAgo(1), daysAgo(3), daysAgo(4)] });
    expect(habitStreak(habit, NOW)).toBe(1);
  });
});

describe('specific-days habit streak', () => {
  it('only counts scheduled days and skips unscheduled gaps', () => {
    // Mon/Wed/Fri schedule; NOW is Friday 2026-01-09.
    // Completed Wed 2026-01-07 and Mon 2026-01-05; Friday not yet done.
    const habit = makeHabit({
      frequency: { type: 'specificDays', days: [1, 3, 5] },
      completedDates: ['2026-01-05', '2026-01-07'],
    });
    expect(habitStreak(habit, NOW)).toBe(2);
  });

  it('breaks when a scheduled day was missed', () => {
    // Missed Wed 2026-01-07.
    const habit = makeHabit({
      frequency: { type: 'specificDays', days: [1, 3, 5] },
      completedDates: ['2026-01-05', '2026-01-09'],
    });
    expect(habitStreak(habit, NOW)).toBe(1);
  });
});

describe('weekly habit streak', () => {
  it('counts consecutive weeks meeting the target', () => {
    // Target 2×/week. Current week (Mon 2026-01-05…) has 2; previous week has 2.
    const habit = makeHabit({
      frequency: { type: 'weekly', timesPerWeek: 2 },
      completedDates: ['2026-01-05', '2026-01-07', '2025-12-29', '2026-01-02'],
    });
    expect(habitStreak(habit, NOW)).toBe(2);
  });

  it('does not count an unmet current week but keeps prior weeks', () => {
    const habit = makeHabit({
      frequency: { type: 'weekly', timesPerWeek: 2 },
      completedDates: ['2026-01-05', '2025-12-29', '2026-01-02'],
    });
    expect(habitStreak(habit, NOW)).toBe(1);
  });
});

describe('global streak advancement', () => {
  it('starts at 1 on first completion', () => {
    const streak = advanceGlobalStreak({ count: 0, lastDate: null, best: 0 }, NOW);
    expect(streak).toEqual({ count: 1, lastDate: dateKey(NOW), best: 1 });
  });

  it('increments when the last completion was yesterday', () => {
    const streak = advanceGlobalStreak({ count: 3, lastDate: daysAgo(1), best: 5 }, NOW);
    expect(streak.count).toBe(4);
    expect(streak.best).toBe(5);
  });

  it('is idempotent within the same day', () => {
    const first = advanceGlobalStreak({ count: 3, lastDate: daysAgo(1), best: 3 }, NOW);
    const second = advanceGlobalStreak(first, NOW);
    expect(second).toEqual(first);
  });

  it('updates the best streak record', () => {
    const streak = advanceGlobalStreak({ count: 5, lastDate: daysAgo(1), best: 5 }, NOW);
    expect(streak.best).toBe(6);
  });
});

describe('global streak survival (day rollover)', () => {
  const active: GlobalStreak = { count: 6, lastDate: daysAgo(3), best: 10 };

  it('does nothing when the streak is current', () => {
    const fresh: GlobalStreak = { count: 6, lastDate: daysAgo(1), best: 10 };
    const result = evaluateGlobalStreak(fresh, 2, NOW);
    expect(result.broken).toBe(false);
    expect(result.shieldsConsumed).toBe(0);
    expect(result.streak).toEqual(fresh);
  });

  it('consumes a shield to bridge a missed gap', () => {
    const result = evaluateGlobalStreak(active, 1, NOW);
    expect(result.broken).toBe(false);
    expect(result.shieldsConsumed).toBe(1);
    expect(result.streak.count).toBe(6);
    expect(result.streak.lastDate).toBe(daysAgo(1));
  });

  it('breaks the streak with no shields, preserving the best record', () => {
    const result = evaluateGlobalStreak(active, 0, NOW);
    expect(result.broken).toBe(true);
    expect(result.streak.count).toBe(0);
    expect(result.streak.best).toBe(10);
  });

  it('ignores an empty streak', () => {
    const result = evaluateGlobalStreak({ count: 0, lastDate: null, best: 4 }, 3, NOW);
    expect(result.broken).toBe(false);
    expect(result.shieldsConsumed).toBe(0);
  });
});
