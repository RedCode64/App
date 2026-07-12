import { SKILL_TREE } from '../src/data/skillTree';
import { aggregateSkillEffects, canUnlockSkill } from '../src/utils/skills';
import { BASE_COMBO_CAP, BASE_COMBO_WINDOW_MS } from '../src/utils/combo';

describe('skill effect aggregation', () => {
  it('returns baseline effects with nothing unlocked', () => {
    const fx = aggregateSkillEffects(SKILL_TREE, []);
    expect(fx.xpMultiplier).toBe(1);
    expect(fx.comboWindowMs).toBe(BASE_COMBO_WINDOW_MS);
    expect(fx.comboCap).toBe(BASE_COMBO_CAP);
    expect(fx.idleMultiplier).toBe(1);
    expect(fx.fragmentBonus).toBe(0);
    expect(fx.shieldOnLevelUp).toBe(false);
  });

  it('stacks XP multipliers additively', () => {
    const fx = aggregateSkillEffects(SKILL_TREE, ['neural-dock', 'cortex-1', 'cortex-2']);
    expect(fx.xpMultiplier).toBeCloseTo(1 + 0.05 + 0.1 + 0.15);
  });

  it('extends the combo window and cap', () => {
    const fx = aggregateSkillEffects(SKILL_TREE, ['neural-dock', 'reflex-1', 'reflex-2', 'reflex-3']);
    expect(fx.comboWindowMs).toBe(BASE_COMBO_WINDOW_MS + 5 * 60 * 1000);
    expect(fx.comboCap).toBeCloseTo(BASE_COMBO_CAP + 1);
  });

  it('activates shield-on-level-up and idle boosts', () => {
    const fx = aggregateSkillEffects(SKILL_TREE, ['neural-dock', 'firmware-1', 'firmware-2', 'ghost-1', 'ghost-2']);
    expect(fx.shieldOnLevelUp).toBe(true);
    expect(fx.idleMultiplier).toBeCloseTo(1.15);
    expect(fx.fragmentBonus).toBe(1);
  });
});

describe('skill unlock rules', () => {
  const root = SKILL_TREE.find((n) => n.id === 'neural-dock')!;
  const child = SKILL_TREE.find((n) => n.id === 'cortex-1')!;

  it('allows unlocking the root with enough points', () => {
    expect(canUnlockSkill(root, [], 1).ok).toBe(true);
  });

  it('blocks a child before its parent is installed', () => {
    const check = canUnlockSkill(child, [], 10);
    expect(check.ok).toBe(false);
    expect(check.reason).toBe('PARENT IMPLANT REQUIRED');
  });

  it('blocks without enough skill points', () => {
    const check = canUnlockSkill(root, [], 0);
    expect(check.ok).toBe(false);
    expect(check.reason).toBe('INSUFFICIENT SKILL POINTS');
  });

  it('blocks re-installing an owned implant', () => {
    const check = canUnlockSkill(root, ['neural-dock'], 10);
    expect(check.ok).toBe(false);
    expect(check.reason).toBe('ALREADY INSTALLED');
  });

  it('has a well-formed tree (every parent exists, unique ids)', () => {
    const ids = new Set(SKILL_TREE.map((n) => n.id));
    expect(ids.size).toBe(SKILL_TREE.length);
    for (const node of SKILL_TREE) {
      if (node.parent !== null) {
        expect(ids.has(node.parent)).toBe(true);
      }
    }
  });
});
