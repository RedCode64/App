import type { UserProfile } from '../types';
import { MAX_LEVEL } from './xp';

export const PRESTIGE_BONUS_PER_RESET = 0.1;
export const PRESTIGE_BONUS_CAP = 1.0;

export function canPrestige(level: number): boolean {
  return level >= MAX_LEVEL;
}

export function prestigeBonus(prestigeCount: number): number {
  return Math.min(prestigeCount * PRESTIGE_BONUS_PER_RESET, PRESTIGE_BONUS_CAP);
}

/**
 * Rebirth: XP, level, skill tree and skill points reset; the runner keeps
 * their identity, cosmetics, achievements and mission history, and gains a
 * permanent +10% XP bonus per reset (capped at +100%).
 */
export function applyPrestige(profile: UserProfile): UserProfile {
  return {
    ...profile,
    xp: 0,
    level: 1,
    skillPoints: 0,
    unlockedSkills: [],
    prestigeCount: profile.prestigeCount + 1,
  };
}
