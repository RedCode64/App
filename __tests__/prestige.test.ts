import { buildInitialProfile } from '../src/utils/profile';
import { applyPrestige, canPrestige, prestigeBonus, PRESTIGE_BONUS_CAP } from '../src/utils/prestige';
import { MAX_LEVEL, totalXpForLevel } from '../src/utils/xp';

describe('prestige eligibility', () => {
  it('requires max level', () => {
    expect(canPrestige(1)).toBe(false);
    expect(canPrestige(MAX_LEVEL - 1)).toBe(false);
    expect(canPrestige(MAX_LEVEL)).toBe(true);
  });
});

describe('prestige bonus', () => {
  it('grants +10% per reset', () => {
    expect(prestigeBonus(0)).toBe(0);
    expect(prestigeBonus(1)).toBeCloseTo(0.1);
    expect(prestigeBonus(3)).toBeCloseTo(0.3);
  });

  it('caps at +100%', () => {
    expect(prestigeBonus(50)).toBe(PRESTIGE_BONUS_CAP);
  });
});

describe('prestige reset', () => {
  const profile = {
    ...buildInitialProfile('a@b.c', 'RUNNER'),
    xp: totalXpForLevel(MAX_LEVEL),
    level: MAX_LEVEL,
    skillPoints: 7,
    unlockedSkills: ['neural-dock', 'cortex-1'],
    prestigeCount: 1,
    achievements: ['first_habit', 'level_25'],
    fragments: 42,
    streakShields: 2,
  };
  profile.character.inventory = ['street-jacket', 'synth-trench', 'chrome-arm'];

  const reborn = applyPrestige(profile);

  it('resets XP, level, skill points and the implant tree', () => {
    expect(reborn.xp).toBe(0);
    expect(reborn.level).toBe(1);
    expect(reborn.skillPoints).toBe(0);
    expect(reborn.unlockedSkills).toEqual([]);
  });

  it('increments prestige count', () => {
    expect(reborn.prestigeCount).toBe(2);
  });

  it('keeps identity, cosmetics, achievements, fragments and shields', () => {
    expect(reborn.character.inventory).toEqual(['street-jacket', 'synth-trench', 'chrome-arm']);
    expect(reborn.character.name).toBe('RUNNER');
    expect(reborn.achievements).toEqual(['first_habit', 'level_25']);
    expect(reborn.fragments).toBe(42);
    expect(reborn.streakShields).toBe(2);
  });

  it('does not mutate the original profile', () => {
    expect(profile.level).toBe(MAX_LEVEL);
    expect(profile.prestigeCount).toBe(1);
  });
});
