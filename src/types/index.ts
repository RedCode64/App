export type HabitCategory = 'body' | 'mind' | 'grind' | 'social';

export type Frequency =
  | { type: 'daily' }
  | { type: 'weekly'; timesPerWeek: number }
  | { type: 'specificDays'; days: number[] }; // 0 = Sunday … 6 = Saturday

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: HabitCategory;
  frequency: Frequency;
  createdAt: number;
  /** ISO date keys (YYYY-MM-DD) on which this habit was completed. */
  completedDates: string[];
  bestStreak: number;
}

export type GearTier = 'street' | 'chrome' | 'netrunner' | 'ghost';

export type CosmeticSlot = 'outfit' | 'headgear' | 'enhancement' | 'accessory';

export type UnlockCondition =
  | { type: 'starter' }
  | { type: 'level'; level: number }
  | { type: 'streak'; days: number }
  | { type: 'prestige'; count: number }
  | { type: 'achievement'; achievementId: string }
  | { type: 'fragments'; cost: number };

export type CosmeticShape =
  | 'jacket'
  | 'trench'
  | 'rig'
  | 'suit'
  | 'visor'
  | 'halo'
  | 'crown'
  | 'mask'
  | 'chromeArm'
  | 'optics'
  | 'spikes'
  | 'core'
  | 'tattoo'
  | 'scarf'
  | 'drone'
  | 'aura';

export interface CosmeticArt {
  shape: CosmeticShape;
  primary: string;
  secondary: string;
}

export interface Cosmetic {
  id: string;
  name: string;
  lore: string;
  slot: CosmeticSlot;
  tier: GearTier;
  unlock: UnlockCondition;
  art: CosmeticArt;
}

export interface CharacterAppearance {
  skinTone: string;
  hairStyle: number; // index into HAIR_STYLES
  hairColor: string;
}

export interface CharacterState {
  name: string;
  appearance: CharacterAppearance;
  equipped: Record<CosmeticSlot, string | null>;
  inventory: string[];
}

export interface IdleMissionEntry {
  id: string;
  title: string;
  endedAt: number;
  xp: number;
  fragments: number;
  shield: boolean;
}

export interface IdleMissionReport {
  missions: IdleMissionEntry[];
  totalXp: number;
  totalFragments: number;
  shieldsGained: number;
  hoursAway: number;
  gearMultiplier: number;
}

export type ChallengeType = 'complete_count' | 'complete_category' | 'combo';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  category?: HabitCategory;
  target: number;
  bonusXp: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  /** Ionicons glyph name. */
  icon: string;
  bonusXp: number;
}

export type SkillEffectType =
  | 'xp_mult'
  | 'combo_window'
  | 'combo_cap'
  | 'shield'
  | 'shield_on_levelup'
  | 'idle_mult'
  | 'fragment_bonus';

export interface SkillEffect {
  type: SkillEffectType;
  value: number;
}

export type SkillBranch = 'core' | 'cortex' | 'reflex' | 'firmware' | 'ghost';

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  parent: string | null;
  x: number;
  y: number;
  branch: SkillBranch;
  effect: SkillEffect;
}

export interface GlobalStreak {
  count: number;
  lastDate: string | null;
  best: number;
}

export interface UserSettings {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  notificationHour: number;
}

export interface UserProfile {
  email: string;
  createdAt: number;
  xp: number;
  level: number;
  skillPoints: number;
  prestigeCount: number;
  unlockedSkills: string[];
  achievements: string[];
  streakShields: number;
  fragments: number;
  totalCompletions: number;
  challengesCompleted: number;
  bestCombo: number;
  globalStreak: GlobalStreak;
  character: CharacterState;
  challenges: { dateKey: string; completedIds: string[] };
  lastSessionTimestamp: number;
  idleMissionLog: IdleMissionEntry[];
  settings: UserSettings;
}

export interface ComboState {
  count: number;
  lastAt: number | null;
}

export interface LeaderboardEntry {
  handle: string;
  xp: number;
  level: number;
  prestige: number;
  isYou?: boolean;
}
