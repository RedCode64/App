/** Transmission flavor text from Rhea, your fixer. */
export const FIXER_NAME = 'RHEA // FIXER';

export const FIXER_TRANSMISSIONS: readonly string[] = [
  'Contracts are going stale, runner. The city doesn’t wait.',
  'Word on the grid says you’ve been quiet. Bad for business. Log in.',
  'Got fresh work with your name encrypted on it. Don’t make me re-broker it.',
  'Your streak is an asset. Assets need maintenance. Move.',
  'Every closed contract buys you chrome. Every skipped one buys your rivals time.',
  'The Foundry, Datafort, Neon Market — pick a district and make noise.',
  'I vouched for you. Don’t make me look bad tonight.',
  'Transmission intercepted: rival crew is out-leveling you. Fix that.',
];

export function randomTransmission(rng: () => number = Math.random): string {
  const idx = Math.floor(rng() * FIXER_TRANSMISSIONS.length);
  return FIXER_TRANSMISSIONS[idx] ?? FIXER_TRANSMISSIONS[0] ?? '';
}
