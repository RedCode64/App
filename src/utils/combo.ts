import type { ComboState } from '../types';

/** Completions within this window chain into a combo. */
export const BASE_COMBO_WINDOW_MS = 10 * 60 * 1000;
export const BASE_COMBO_CAP = 2.0;
export const COMBO_STEP = 0.1;

/**
 * Advance the combo chain: a completion within the window extends the chain,
 * anything later starts a new one.
 */
export function nextCombo(prev: ComboState, now: number, windowMs: number = BASE_COMBO_WINDOW_MS): ComboState {
  if (prev.lastAt !== null && now - prev.lastAt <= windowMs && now >= prev.lastAt) {
    return { count: prev.count + 1, lastAt: now };
  }
  return { count: 1, lastAt: now };
}

/** Multiplier for the Nth habit in a chain: 1.0, 1.1, 1.2 … capped. */
export function comboMultiplier(count: number, cap: number = BASE_COMBO_CAP): number {
  if (count <= 1) return 1;
  return Math.min(1 + COMBO_STEP * (count - 1), cap);
}
