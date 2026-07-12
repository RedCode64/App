import {
  calculateIdleMissions,
  HOURS_PER_MISSION,
  MAX_IDLE_MISSIONS,
  MIN_IDLE_MS,
  type IdleMissionInput,
} from '../src/utils/idleMissions';

const HOUR = 60 * 60 * 1000;
const T0 = 1_760_000_000_000;

function input(overrides: Partial<IdleMissionInput> = {}): IdleMissionInput {
  return {
    uid: 'runner-1',
    lastSessionTimestamp: T0,
    now: T0 + 12 * HOUR,
    gearMultiplier: 1,
    prestigeBonus: 0,
    idleMultiplier: 1,
    fragmentBonus: 0,
    ...overrides,
  };
}

describe('Ghost Protocol idle missions', () => {
  it('produces nothing below the minimum away time', () => {
    expect(calculateIdleMissions(input({ now: T0 + MIN_IDLE_MS - 1 }))).toBeNull();
  });

  it('produces nothing for an unset last-session timestamp', () => {
    expect(calculateIdleMissions(input({ lastSessionTimestamp: 0 }))).toBeNull();
  });

  it('completes one mission per idle block', () => {
    const report = calculateIdleMissions(input({ now: T0 + 12 * HOUR }));
    expect(report).not.toBeNull();
    expect(report?.missions).toHaveLength(Math.floor(12 / HOURS_PER_MISSION));
  });

  it('caps the number of missions for very long absences', () => {
    const report = calculateIdleMissions(input({ now: T0 + 500 * HOUR }));
    expect(report?.missions).toHaveLength(MAX_IDLE_MISSIONS);
  });

  it('is fully deterministic for identical inputs', () => {
    const a = calculateIdleMissions(input());
    const b = calculateIdleMissions(input());
    expect(a).toEqual(b);
  });

  it('varies with the seed (different uid → different outcome)', () => {
    const a = calculateIdleMissions(input({ uid: 'runner-1' }));
    const b = calculateIdleMissions(input({ uid: 'runner-2' }));
    expect(a?.totalXp === b?.totalXp && a?.totalFragments === b?.totalFragments).toBe(false);
  });

  it('scales XP with the gear tier multiplier', () => {
    const street = calculateIdleMissions(input({ gearMultiplier: 1 }));
    const ghost = calculateIdleMissions(input({ gearMultiplier: 2 }));
    expect(ghost!.totalXp).toBeGreaterThan(street!.totalXp);
  });

  it('scales XP with the skill idle multiplier and prestige bonus', () => {
    const base = calculateIdleMissions(input());
    const boosted = calculateIdleMissions(input({ idleMultiplier: 1.5, prestigeBonus: 0.5 }));
    expect(boosted!.totalXp).toBeGreaterThan(base!.totalXp);
  });

  it('adds the flat fragment bonus to the total', () => {
    const base = calculateIdleMissions(input());
    const bonus = calculateIdleMissions(input({ fragmentBonus: 3 }));
    expect(bonus!.totalFragments).toBe(base!.totalFragments + 3);
  });

  it('sums mission rewards into the report totals', () => {
    const report = calculateIdleMissions(input())!;
    const xpSum = report.missions.reduce((sum, m) => sum + m.xp, 0);
    const fragSum = report.missions.reduce((sum, m) => sum + m.fragments, 0);
    const shieldSum = report.missions.filter((m) => m.shield).length;
    expect(report.totalXp).toBe(xpSum);
    expect(report.totalFragments).toBe(fragSum);
    expect(report.shieldsGained).toBe(shieldSum);
  });

  it('reports away time and gear multiplier for the debrief UI', () => {
    const report = calculateIdleMissions(input({ now: T0 + 12 * HOUR, gearMultiplier: 1.25 }))!;
    expect(report.hoursAway).toBe(12);
    expect(report.gearMultiplier).toBe(1.25);
  });
});
