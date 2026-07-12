import {
  BASE_HABIT_XP,
  MAX_LEVEL,
  calculateCompletionXp,
  levelFromXp,
  totalXpForLevel,
  xpProgress,
  xpRequiredForLevel,
} from '../src/utils/xp';

describe('XP curve', () => {
  it('requires more XP for each successive level', () => {
    for (let level = 1; level < MAX_LEVEL - 1; level++) {
      expect(xpRequiredForLevel(level + 1)).toBeGreaterThan(xpRequiredForLevel(level));
    }
  });

  it('starts at level 1 with 0 XP', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(totalXpForLevel(1)).toBe(0);
  });

  it('levels up exactly at the threshold', () => {
    const threshold = xpRequiredForLevel(1);
    expect(levelFromXp(threshold - 1)).toBe(1);
    expect(levelFromXp(threshold)).toBe(2);
  });

  it('is consistent between totalXpForLevel and levelFromXp', () => {
    for (const level of [2, 5, 10, 25, 49]) {
      expect(levelFromXp(totalXpForLevel(level))).toBe(level);
      expect(levelFromXp(totalXpForLevel(level) - 1)).toBe(level - 1);
    }
  });

  it('caps at MAX_LEVEL no matter how much XP accrues', () => {
    expect(levelFromXp(totalXpForLevel(MAX_LEVEL) * 10)).toBe(MAX_LEVEL);
  });

  it('reports full progress at max level', () => {
    const progress = xpProgress(totalXpForLevel(MAX_LEVEL) + 500);
    expect(progress.level).toBe(MAX_LEVEL);
    expect(progress.required).toBe(0);
    expect(progress.ratio).toBe(1);
  });

  it('reports partial progress within a level', () => {
    const progress = xpProgress(totalXpForLevel(3) + 10);
    expect(progress.level).toBe(3);
    expect(progress.current).toBe(10);
    expect(progress.required).toBe(xpRequiredForLevel(3));
  });
});

describe('completion XP calculation', () => {
  const base = {
    comboMultiplier: 1,
    prestigeBonus: 0,
    skillXpMultiplier: 1,
    streakBonus: 0,
  };

  it('returns base XP with no modifiers', () => {
    expect(calculateCompletionXp(base)).toBe(BASE_HABIT_XP);
  });

  it('applies the combo multiplier', () => {
    expect(calculateCompletionXp({ ...base, comboMultiplier: 2 })).toBe(BASE_HABIT_XP * 2);
  });

  it('applies the prestige bonus multiplicatively', () => {
    expect(calculateCompletionXp({ ...base, prestigeBonus: 0.2 })).toBe(Math.round(BASE_HABIT_XP * 1.2));
  });

  it('applies the skill XP multiplier', () => {
    expect(calculateCompletionXp({ ...base, skillXpMultiplier: 1.5 })).toBe(Math.round(BASE_HABIT_XP * 1.5));
  });

  it('adds the streak bonus after multipliers', () => {
    expect(calculateCompletionXp({ ...base, comboMultiplier: 2, streakBonus: 12 })).toBe(BASE_HABIT_XP * 2 + 12);
  });

  it('stacks all modifiers together', () => {
    const xp = calculateCompletionXp({
      comboMultiplier: 1.5,
      prestigeBonus: 0.3,
      skillXpMultiplier: 1.2,
      streakBonus: 20,
    });
    expect(xp).toBe(Math.round(BASE_HABIT_XP * 1.5 * 1.3 * 1.2 + 20));
  });

  it('never lets malformed inputs reduce XP below base', () => {
    expect(
      calculateCompletionXp({ comboMultiplier: 0, prestigeBonus: -1, skillXpMultiplier: 0.5, streakBonus: -5 }),
    ).toBe(BASE_HABIT_XP);
  });
});
