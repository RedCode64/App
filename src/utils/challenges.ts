import type { DailyChallenge, Habit, HabitCategory } from '../types';
import { pickDistinct, seededRng } from './rng';

interface ChallengeTemplate {
  id: string;
  make: () => DailyChallenge;
}

const CATEGORY_NAMES: Record<HabitCategory, string> = {
  body: 'Chrome District',
  mind: 'Datafort',
  grind: 'the Foundry',
  social: 'Neon Market',
};

const TEMPLATES: readonly ChallengeTemplate[] = [
  {
    id: 'count-2',
    make: () => ({
      id: 'count-2',
      title: 'DOUBLE TAP',
      description: 'Close out 2 contracts today.',
      type: 'complete_count',
      target: 2,
      bonusXp: 40,
    }),
  },
  {
    id: 'count-3',
    make: () => ({
      id: 'count-3',
      title: 'TRIPLE THREAT',
      description: 'Close out 3 contracts today.',
      type: 'complete_count',
      target: 3,
      bonusXp: 60,
    }),
  },
  {
    id: 'count-4',
    make: () => ({
      id: 'count-4',
      title: 'FULL SWEEP',
      description: 'Close out 4 contracts today.',
      type: 'complete_count',
      target: 4,
      bonusXp: 90,
    }),
  },
  ...(['body', 'mind', 'grind', 'social'] as HabitCategory[]).map((cat) => ({
    id: `cat-${cat}`,
    make: (): DailyChallenge => ({
      id: `cat-${cat}`,
      title: `${CATEGORY_NAMES[cat].toUpperCase()} OP`,
      description: `Complete a contract in ${CATEGORY_NAMES[cat]}.`,
      type: 'complete_category',
      category: cat,
      target: 1,
      bonusXp: 45,
    }),
  })),
  {
    id: 'combo-3',
    make: () => ({
      id: 'combo-3',
      title: 'CHAIN RUNNER',
      description: 'Hit a 3× completion chain without breaking the window.',
      type: 'combo',
      target: 3,
      bonusXp: 75,
    }),
  },
  {
    id: 'combo-4',
    make: () => ({
      id: 'combo-4',
      title: 'OVERCLOCKED',
      description: 'Hit a 4× completion chain without breaking the window.',
      type: 'combo',
      target: 4,
      bonusXp: 100,
    }),
  },
];

export const DAILY_CHALLENGE_COUNT = 3;

/**
 * Deterministic daily missions: the same user gets the same 3 challenges for a
 * given date on any device. They refresh when the date key rolls over at
 * midnight (the store re-generates on day change).
 */
export function generateDailyChallenges(uid: string, dateKey: string): DailyChallenge[] {
  const rng = seededRng(`${uid}:${dateKey}:challenges`);
  return pickDistinct(TEMPLATES, DAILY_CHALLENGE_COUNT, rng).map((t) => t.make());
}

export interface ChallengeContext {
  habits: Habit[];
  todayKey: string;
  comboCount: number;
  bestComboToday: number;
}

/** Progress toward a challenge, evaluated against today's activity. */
export function challengeProgress(challenge: DailyChallenge, ctx: ChallengeContext): number {
  switch (challenge.type) {
    case 'complete_count':
      return ctx.habits.filter((h) => h.completedDates.includes(ctx.todayKey)).length;
    case 'complete_category':
      return ctx.habits.filter((h) => h.category === challenge.category && h.completedDates.includes(ctx.todayKey))
        .length;
    case 'combo':
      return ctx.bestComboToday;
  }
}

export function isChallengeMet(challenge: DailyChallenge, ctx: ChallengeContext): boolean {
  return challengeProgress(challenge, ctx) >= challenge.target;
}
