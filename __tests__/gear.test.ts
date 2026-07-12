import { COSMETICS } from '../src/data/cosmetics';
import { equippedGearMultiplier, overallGearTier, TIER_MULTIPLIER } from '../src/utils/gear';
import type { CosmeticSlot } from '../src/types';

const empty: Record<CosmeticSlot, string | null> = {
  outfit: null,
  headgear: null,
  enhancement: null,
  accessory: null,
};

describe('gear tier multiplier', () => {
  it('is 1× with nothing equipped (empty slots count as street)', () => {
    expect(equippedGearMultiplier(empty, COSMETICS)).toBe(1);
  });

  it('averages tiers across the four slots', () => {
    // One ghost item (×2) + three empty (×1) → (2+1+1+1)/4 = 1.25.
    const equipped = { ...empty, outfit: 'ghost-suit' };
    expect(equippedGearMultiplier(equipped, COSMETICS)).toBeCloseTo(1.25);
  });

  it('reaches ×2 with a full ghost loadout', () => {
    const equipped: Record<CosmeticSlot, string | null> = {
      outfit: 'ghost-suit',
      headgear: 'ghost-mask',
      enhancement: 'ghost-core',
      accessory: 'spectral-aura',
    };
    expect(equippedGearMultiplier(equipped, COSMETICS)).toBe(2);
  });

  it('treats unknown ids as empty slots', () => {
    const equipped = { ...empty, outfit: 'does-not-exist' };
    expect(equippedGearMultiplier(equipped, COSMETICS)).toBe(1);
  });

  it('uses the documented tier ladder', () => {
    expect(TIER_MULTIPLIER.street).toBe(1);
    expect(TIER_MULTIPLIER.chrome).toBe(1.25);
    expect(TIER_MULTIPLIER.netrunner).toBe(1.5);
    expect(TIER_MULTIPLIER.ghost).toBe(2);
  });
});

describe('overall gear tier label', () => {
  it('maps multiplier ranges to tiers', () => {
    expect(overallGearTier(1)).toBe('street');
    expect(overallGearTier(1.2)).toBe('chrome');
    expect(overallGearTier(1.5)).toBe('netrunner');
    expect(overallGearTier(2)).toBe('ghost');
  });
});

describe('cosmetics catalog integrity', () => {
  it('has unique ids', () => {
    const ids = COSMETICS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every slot with at least one item per tier ladder step', () => {
    for (const slot of ['outfit', 'headgear', 'enhancement', 'accessory'] as const) {
      const items = COSMETICS.filter((c) => c.slot === slot);
      expect(items.length).toBeGreaterThanOrEqual(4);
      expect(new Set(items.map((i) => i.tier)).size).toBe(4);
    }
  });
});
