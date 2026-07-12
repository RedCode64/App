import type { Cosmetic, CosmeticSlot, GearTier } from '../types';

export const TIER_MULTIPLIER: Record<GearTier, number> = {
  street: 1,
  chrome: 1.25,
  netrunner: 1.5,
  ghost: 2,
};

export const TIER_ORDER: GearTier[] = ['street', 'chrome', 'netrunner', 'ghost'];

export const GEAR_SLOTS: CosmeticSlot[] = ['outfit', 'headgear', 'enhancement', 'accessory'];

/**
 * Average tier multiplier across all four gear slots. Empty slots count as
 * street tier (1×), so a fully-kitted Ghost loadout yields 2× idle rewards.
 */
export function equippedGearMultiplier(
  equipped: Record<CosmeticSlot, string | null>,
  catalog: readonly Cosmetic[],
): number {
  const byId = new Map(catalog.map((c) => [c.id, c]));
  let total = 0;
  for (const slot of GEAR_SLOTS) {
    const id = equipped[slot];
    const item = id ? byId.get(id) : undefined;
    total += item ? TIER_MULTIPLIER[item.tier] : TIER_MULTIPLIER.street;
  }
  return total / GEAR_SLOTS.length;
}

/** Overall loadout tier label derived from the average multiplier. */
export function overallGearTier(multiplier: number): GearTier {
  if (multiplier >= 1.85) return 'ghost';
  if (multiplier >= 1.4) return 'netrunner';
  if (multiplier >= 1.15) return 'chrome';
  return 'street';
}
