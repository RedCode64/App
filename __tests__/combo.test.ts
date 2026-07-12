import { BASE_COMBO_CAP, BASE_COMBO_WINDOW_MS, comboMultiplier, nextCombo } from '../src/utils/combo';

describe('combo chain', () => {
  const t0 = 1_700_000_000_000;

  it('starts a chain at 1', () => {
    const combo = nextCombo({ count: 0, lastAt: null }, t0);
    expect(combo).toEqual({ count: 1, lastAt: t0 });
  });

  it('extends the chain within the window', () => {
    const first = nextCombo({ count: 0, lastAt: null }, t0);
    const second = nextCombo(first, t0 + BASE_COMBO_WINDOW_MS - 1);
    expect(second.count).toBe(2);
    const third = nextCombo(second, second.lastAt! + 60_000);
    expect(third.count).toBe(3);
  });

  it('resets the chain after the window expires', () => {
    const first = nextCombo({ count: 0, lastAt: null }, t0);
    const late = nextCombo(first, t0 + BASE_COMBO_WINDOW_MS + 1);
    expect(late.count).toBe(1);
  });

  it('respects a custom (skill-extended) window', () => {
    const window = BASE_COMBO_WINDOW_MS + 5 * 60_000;
    const first = nextCombo({ count: 0, lastAt: null }, t0, window);
    const second = nextCombo(first, t0 + BASE_COMBO_WINDOW_MS + 60_000, window);
    expect(second.count).toBe(2);
  });
});

describe('combo multiplier', () => {
  it('is 1× for the first completion', () => {
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(0)).toBe(1);
  });

  it('adds 0.1× per chained completion', () => {
    expect(comboMultiplier(2)).toBeCloseTo(1.1);
    expect(comboMultiplier(5)).toBeCloseTo(1.4);
  });

  it('caps at the base cap', () => {
    expect(comboMultiplier(999)).toBe(BASE_COMBO_CAP);
  });

  it('respects a raised (skill-extended) cap', () => {
    expect(comboMultiplier(999, 3)).toBe(3);
    expect(comboMultiplier(2, 3)).toBeCloseTo(1.1);
  });
});
