import type { IdleMissionEntry, IdleMissionReport } from '../types';
import { seededRng } from './rng';

/** Minimum away time before Ghost Protocol produces a report. */
export const MIN_IDLE_MS = 3 * 60 * 60 * 1000;
/** One mission is completed per this many hours away. */
export const HOURS_PER_MISSION = 3;
export const MAX_IDLE_MISSIONS = 8;
export const MAX_STREAK_SHIELDS = 5;

const MISSION_TITLES: readonly string[] = [
  'Data heist in the Datafort undercity',
  'Escort run through Neon Market',
  'ICE-breaking gig for a Chrome District fixer',
  'Ghost-tail surveillance on a corpo exec',
  'Warehouse extraction past Foundry checkpoints',
  'Signal-jamming sweep of rooftop relays',
  'Black-market courier drop, no questions asked',
  'Netdive salvage in a derelict server farm',
  'Bodyguard shift at an underground synth club',
  'Decrypting a dead runner’s lockbox',
  'Sabotage of a rival crew’s botnet',
  'Smuggling chrome past the city grid scanners',
];

export interface IdleMissionInput {
  uid: string;
  lastSessionTimestamp: number;
  now: number;
  /** Average equipped gear tier multiplier (1.0 – 2.0). */
  gearMultiplier: number;
  /** Permanent prestige XP bonus (0.1 = +10%). */
  prestigeBonus: number;
  /** Skill-tree idle reward multiplier (1.0 = no bonus). */
  idleMultiplier: number;
  /** Skill-tree flat bonus fragments added to the report total. */
  fragmentBonus: number;
}

/**
 * Ghost Protocol: deterministically computes what the character accomplished
 * while the user was away. Same inputs always produce the same report, so the
 * outcome can be computed client-side with no server job.
 */
export function calculateIdleMissions(input: IdleMissionInput): IdleMissionReport | null {
  const { uid, lastSessionTimestamp, now, gearMultiplier, prestigeBonus, idleMultiplier, fragmentBonus } = input;
  if (lastSessionTimestamp <= 0) return null;
  const elapsed = now - lastSessionTimestamp;
  if (elapsed < MIN_IDLE_MS) return null;

  const hoursAway = elapsed / (60 * 60 * 1000);
  const missionCount = Math.min(Math.floor(hoursAway / HOURS_PER_MISSION), MAX_IDLE_MISSIONS);
  if (missionCount <= 0) return null;

  const rng = seededRng(`${uid}:${lastSessionTimestamp}`);
  const rewardScale = Math.max(1, gearMultiplier) * Math.max(1, idleMultiplier) * (1 + Math.max(0, prestigeBonus));

  const missions: IdleMissionEntry[] = [];
  let totalXp = 0;
  let totalFragments = 0;
  let shieldsGained = 0;

  for (let i = 0; i < missionCount; i++) {
    const title = MISSION_TITLES[Math.floor(rng() * MISSION_TITLES.length)] ?? 'Unlisted gig';
    const baseXp = 20 + rng() * 30;
    const xp = Math.round(baseXp * rewardScale);
    const fragments = Math.floor(rng() * 3 * Math.max(1, gearMultiplier));
    const shield = rng() < 0.06 * Math.max(1, gearMultiplier);
    if (shield) shieldsGained += 1;
    totalXp += xp;
    totalFragments += fragments;
    missions.push({
      id: `${lastSessionTimestamp}-${i}`,
      title,
      endedAt: lastSessionTimestamp + (i + 1) * HOURS_PER_MISSION * 60 * 60 * 1000,
      xp,
      fragments,
      shield,
    });
  }

  totalFragments += Math.max(0, fragmentBonus);

  return {
    missions,
    totalXp,
    totalFragments,
    shieldsGained,
    hoursAway: Math.round(hoursAway * 10) / 10,
    gearMultiplier: Math.round(gearMultiplier * 100) / 100,
  };
}
