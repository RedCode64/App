import type { LeaderboardEntry } from '../types';
import { levelFromXp } from '../utils/xp';

/**
 * Mocked global leaderboard. A real deployment would back this with a
 * Firestore collection or Cloud Function; the interface below is written so
 * the data source can be swapped without touching the screen.
 */
const MOCK_RUNNERS: readonly { handle: string; xp: number; prestige: number }[] = [
  { handle: 'V0LT4GE', xp: 148200, prestige: 3 },
  { handle: 'null_saint', xp: 121500, prestige: 2 },
  { handle: 'KUROI-9', xp: 99800, prestige: 2 },
  { handle: 'proxy_wraith', xp: 87400, prestige: 1 },
  { handle: 'DAEMONETTE', xp: 76100, prestige: 1 },
  { handle: 'glasshand', xp: 64900, prestige: 1 },
  { handle: 'STATIC//NUN', xp: 55300, prestige: 1 },
  { handle: 'rez_edge', xp: 47800, prestige: 0 },
  { handle: 'M0NGOOSE', xp: 40100, prestige: 0 },
  { handle: 'hexadecimAl', xp: 33600, prestige: 0 },
  { handle: 'Sable_Rat', xp: 27200, prestige: 0 },
  { handle: 'circuitpriest', xp: 21400, prestige: 0 },
  { handle: 'N1GHTCALL', xp: 16800, prestige: 0 },
  { handle: 'ferro_kid', xp: 12100, prestige: 0 },
  { handle: 'BLU_SCREEN', xp: 8600, prestige: 0 },
  { handle: 'anodyne.exe', xp: 5900, prestige: 0 },
  { handle: 'RAT-KING', xp: 3400, prestige: 0 },
  { handle: 'dust_witch', xp: 1700, prestige: 0 },
  { handle: 'off_grid', xp: 600, prestige: 0 },
  { handle: 'newboot', xp: 120, prestige: 0 },
];

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  yourRank: number;
}

/**
 * Simulates a network fetch (latency + occasional failure) so the screen's
 * loading and retry states are exercised like a real backend.
 */
export function fetchLeaderboard(you: { handle: string; xp: number; prestige: number }): Promise<LeaderboardResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.12) {
        reject(new Error('UPLINK SEVERED — the grid rejected the query.'));
        return;
      }
      const entries: LeaderboardEntry[] = [
        ...MOCK_RUNNERS.map((r) => ({
          handle: r.handle,
          xp: r.xp,
          level: levelFromXp(r.xp),
          prestige: r.prestige,
        })),
        {
          handle: you.handle,
          xp: you.xp,
          level: levelFromXp(you.xp),
          prestige: you.prestige,
          isYou: true,
        },
      ].sort((a, b) => b.xp - a.xp);
      const yourRank = entries.findIndex((e) => e.isYou === true) + 1;
      resolve({ entries, yourRank });
    }, 700);
  });
}
