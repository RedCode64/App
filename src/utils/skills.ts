import type { SkillNode } from '../types';
import { BASE_COMBO_CAP, BASE_COMBO_WINDOW_MS } from './combo';

export interface AggregatedSkillEffects {
  xpMultiplier: number;
  comboWindowMs: number;
  comboCap: number;
  idleMultiplier: number;
  fragmentBonus: number;
  shieldOnLevelUp: boolean;
}

/** Fold every unlocked node's passive effect into one effect sheet. */
export function aggregateSkillEffects(nodes: readonly SkillNode[], unlockedIds: readonly string[]): AggregatedSkillEffects {
  const unlocked = new Set(unlockedIds);
  const out: AggregatedSkillEffects = {
    xpMultiplier: 1,
    comboWindowMs: BASE_COMBO_WINDOW_MS,
    comboCap: BASE_COMBO_CAP,
    idleMultiplier: 1,
    fragmentBonus: 0,
    shieldOnLevelUp: false,
  };
  for (const node of nodes) {
    if (!unlocked.has(node.id)) continue;
    switch (node.effect.type) {
      case 'xp_mult':
        out.xpMultiplier += node.effect.value;
        break;
      case 'combo_window':
        out.comboWindowMs += node.effect.value;
        break;
      case 'combo_cap':
        out.comboCap += node.effect.value;
        break;
      case 'idle_mult':
        out.idleMultiplier += node.effect.value;
        break;
      case 'fragment_bonus':
        out.fragmentBonus += node.effect.value;
        break;
      case 'shield_on_levelup':
        out.shieldOnLevelUp = true;
        break;
      case 'shield':
        // Immediate grant, applied once at unlock time by the store.
        break;
    }
  }
  return out;
}

export function canUnlockSkill(
  node: SkillNode,
  unlockedIds: readonly string[],
  skillPoints: number,
): { ok: boolean; reason: string | null } {
  if (unlockedIds.includes(node.id)) return { ok: false, reason: 'ALREADY INSTALLED' };
  if (node.parent !== null && !unlockedIds.includes(node.parent)) {
    return { ok: false, reason: 'PARENT IMPLANT REQUIRED' };
  }
  if (skillPoints < node.cost) return { ok: false, reason: 'INSUFFICIENT SKILL POINTS' };
  return { ok: true, reason: null };
}
