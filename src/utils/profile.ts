import type { CharacterAppearance, UserProfile } from '../types';
import { DEFAULT_APPEARANCE, STARTER_COSMETIC_IDS } from '../data/cosmetics';

export function buildInitialProfile(
  email: string,
  characterName: string,
  appearance: CharacterAppearance = DEFAULT_APPEARANCE,
  now: number = Date.now(),
): UserProfile {
  return {
    email,
    createdAt: now,
    xp: 0,
    level: 1,
    skillPoints: 1,
    prestigeCount: 0,
    unlockedSkills: [],
    achievements: [],
    streakShields: 0,
    fragments: 0,
    totalCompletions: 0,
    challengesCompleted: 0,
    bestCombo: 0,
    globalStreak: { count: 0, lastDate: null, best: 0 },
    character: {
      name: characterName,
      appearance,
      equipped: {
        outfit: STARTER_COSMETIC_IDS[0] ?? null,
        headgear: null,
        enhancement: null,
        accessory: null,
      },
      inventory: [...STARTER_COSMETIC_IDS],
    },
    challenges: { dateKey: '', completedIds: [] },
    lastSessionTimestamp: now,
    idleMissionLog: [],
    settings: {
      soundEnabled: true,
      notificationsEnabled: false,
      notificationHour: 19,
    },
  };
}
