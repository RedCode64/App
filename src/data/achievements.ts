import type { AchievementDef, UserProfile } from '../types';

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: 'first_habit',
    name: 'JACKED IN',
    description: 'Register your first contract.',
    icon: 'flash',
    bonusXp: 20,
  },
  {
    id: 'completions_10',
    name: 'STREET CRED',
    description: 'Close out 10 contracts.',
    icon: 'checkmark-done',
    bonusXp: 50,
  },
  {
    id: 'completions_25',
    name: 'MADE RUNNER',
    description: 'Close out 25 contracts.',
    icon: 'ribbon',
    bonusXp: 80,
  },
  {
    id: 'completions_100',
    name: 'CITY LEGEND',
    description: 'Close out 100 contracts.',
    icon: 'skull',
    bonusXp: 200,
  },
  {
    id: 'streak_7',
    name: 'UPTIME: 7',
    description: 'Hold a 7-day account streak.',
    icon: 'flame',
    bonusXp: 60,
  },
  {
    id: 'streak_30',
    name: 'UPTIME: 30',
    description: 'Hold a 30-day account streak.',
    icon: 'bonfire',
    bonusXp: 250,
  },
  {
    id: 'level_5',
    name: 'FIRMWARE 5.0',
    description: 'Reach level 5.',
    icon: 'chevron-up-circle',
    bonusXp: 40,
  },
  {
    id: 'level_10',
    name: 'FIRMWARE 10.0',
    description: 'Reach level 10.',
    icon: 'arrow-up-circle',
    bonusXp: 100,
  },
  {
    id: 'level_25',
    name: 'FIRMWARE 25.0',
    description: 'Reach level 25.',
    icon: 'rocket',
    bonusXp: 250,
  },
  {
    id: 'combo_5',
    name: 'CHAIN LIGHTNING',
    description: 'Hit a 5× completion chain.',
    icon: 'link',
    bonusXp: 90,
  },
  {
    id: 'challenges_10',
    name: 'FIXER FAVORITE',
    description: 'Complete 10 daily missions.',
    icon: 'radio',
    bonusXp: 120,
  },
  {
    id: 'skills_5',
    name: 'CHROMED UP',
    description: 'Install 5 neural implants.',
    icon: 'git-network',
    bonusXp: 100,
  },
  {
    id: 'collector_8',
    name: 'WARDROBE OF THE DAMNED',
    description: 'Own 8 pieces of gear.',
    icon: 'shirt',
    bonusXp: 120,
  },
  {
    id: 'prestige_1',
    name: 'REBIRTH PROTOCOL',
    description: 'Flatline and come back stronger. Prestige once.',
    icon: 'infinite',
    bonusXp: 0,
  },
];

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/** Which achievements does this profile qualify for that it doesn't hold yet? */
export function pendingAchievements(profile: UserProfile, habitCount: number): AchievementDef[] {
  const held = new Set(profile.achievements);
  const qualifies = (id: string): boolean => {
    switch (id) {
      case 'first_habit':
        return habitCount > 0;
      case 'completions_10':
        return profile.totalCompletions >= 10;
      case 'completions_25':
        return profile.totalCompletions >= 25;
      case 'completions_100':
        return profile.totalCompletions >= 100;
      case 'streak_7':
        return profile.globalStreak.best >= 7;
      case 'streak_30':
        return profile.globalStreak.best >= 30;
      case 'level_5':
        return profile.level >= 5;
      case 'level_10':
        return profile.level >= 10;
      case 'level_25':
        return profile.level >= 25;
      case 'combo_5':
        return profile.bestCombo >= 5;
      case 'challenges_10':
        return profile.challengesCompleted >= 10;
      case 'skills_5':
        return profile.unlockedSkills.length >= 5;
      case 'collector_8':
        return profile.character.inventory.length >= 8;
      case 'prestige_1':
        return profile.prestigeCount >= 1;
      default:
        return false;
    }
  };
  return ACHIEVEMENTS.filter((a) => !held.has(a.id) && qualifies(a.id));
}
