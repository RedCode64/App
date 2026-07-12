import { DAILY_CHALLENGE_COUNT, challengeProgress, generateDailyChallenges, isChallengeMet } from '../src/utils/challenges';
import type { Habit } from '../src/types';

function habit(overrides: Partial<Habit>): Habit {
  return {
    id: Math.random().toString(36).slice(2),
    name: 'H',
    description: '',
    category: 'body',
    frequency: { type: 'daily' },
    createdAt: 0,
    completedDates: [],
    bestStreak: 0,
    ...overrides,
  };
}

describe('daily challenge generation', () => {
  it('generates the configured number of distinct challenges', () => {
    const list = generateDailyChallenges('uid-1', '2026-03-01');
    expect(list).toHaveLength(DAILY_CHALLENGE_COUNT);
    expect(new Set(list.map((c) => c.id)).size).toBe(DAILY_CHALLENGE_COUNT);
  });

  it('is deterministic for the same user and date', () => {
    const a = generateDailyChallenges('uid-1', '2026-03-01');
    const b = generateDailyChallenges('uid-1', '2026-03-01');
    expect(a).toEqual(b);
  });

  it('refreshes (changes) across dates', () => {
    const days = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05'];
    const signatures = days.map((d) =>
      generateDailyChallenges('uid-1', d)
        .map((c) => c.id)
        .join(','),
    );
    expect(new Set(signatures).size).toBeGreaterThan(1);
  });
});

describe('challenge progress evaluation', () => {
  const today = '2026-03-01';
  const habits = [
    habit({ category: 'body', completedDates: [today] }),
    habit({ category: 'mind', completedDates: [today] }),
    habit({ category: 'grind', completedDates: ['2026-02-28'] }),
  ];
  const ctx = { habits, todayKey: today, comboCount: 2, bestComboToday: 3 };

  it('counts today’s completions for complete_count', () => {
    const challenge = {
      id: 'count-3',
      title: '',
      description: '',
      type: 'complete_count' as const,
      target: 3,
      bonusXp: 60,
    };
    expect(challengeProgress(challenge, ctx)).toBe(2);
    expect(isChallengeMet(challenge, ctx)).toBe(false);
  });

  it('counts category completions for complete_category', () => {
    const challenge = {
      id: 'cat-body',
      title: '',
      description: '',
      type: 'complete_category' as const,
      category: 'body' as const,
      target: 1,
      bonusXp: 45,
    };
    expect(challengeProgress(challenge, ctx)).toBe(1);
    expect(isChallengeMet(challenge, ctx)).toBe(true);
  });

  it('uses the best combo of the day for combo challenges', () => {
    const challenge = {
      id: 'combo-3',
      title: '',
      description: '',
      type: 'combo' as const,
      target: 3,
      bonusXp: 75,
    };
    expect(challengeProgress(challenge, ctx)).toBe(3);
    expect(isChallengeMet(challenge, ctx)).toBe(true);
  });
});
