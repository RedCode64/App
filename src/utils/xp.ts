export const MAX_LEVEL = 50;
export const BASE_HABIT_XP = 25;

/** XP required to advance FROM `level` to `level + 1`. */
export function xpRequiredForLevel(level: number): number {
  const clamped = Math.max(1, Math.min(level, MAX_LEVEL));
  return Math.round(100 * Math.pow(clamped, 1.35));
}

/** Total (cumulative) XP required to HAVE reached `level`. Level 1 = 0 XP. */
export function totalXpForLevel(level: number): number {
  let total = 0;
  for (let l = 1; l < Math.min(level, MAX_LEVEL); l++) {
    total += xpRequiredForLevel(l);
  }
  return total;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  let remaining = Math.max(0, xp);
  while (level < MAX_LEVEL && remaining >= xpRequiredForLevel(level)) {
    remaining -= xpRequiredForLevel(level);
    level += 1;
  }
  return level;
}

export interface XpProgress {
  level: number;
  /** XP earned within the current level. */
  current: number;
  /** XP needed to advance to the next level (0 at max level). */
  required: number;
  ratio: number;
}

export function xpProgress(xp: number): XpProgress {
  const level = levelFromXp(xp);
  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, current: 0, required: 0, ratio: 1 };
  }
  const current = Math.max(0, xp - totalXpForLevel(level));
  const required = xpRequiredForLevel(level);
  return { level, current, required, ratio: Math.min(1, current / required) };
}

export interface CompletionXpInput {
  comboMultiplier: number;
  prestigeBonus: number; // 0.1 = +10%
  skillXpMultiplier: number; // 1.0 = no bonus
  streakBonus: number; // flat XP added after multipliers
}

export function calculateCompletionXp(input: CompletionXpInput): number {
  const { comboMultiplier, prestigeBonus, skillXpMultiplier, streakBonus } = input;
  const multiplied =
    BASE_HABIT_XP * Math.max(1, comboMultiplier) * (1 + Math.max(0, prestigeBonus)) * Math.max(1, skillXpMultiplier);
  return Math.round(multiplied + Math.max(0, streakBonus));
}
