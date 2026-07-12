/**
 * Deterministic PRNG utilities. Idle mission rewards and daily challenges must
 * be reproducible from (uid, timestamp/date) so that the same session gap
 * always yields the same outcome regardless of device.
 */

/** xmur3 string hash — turns an arbitrary string into a 32-bit seed. */
export function hashSeed(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 — small, fast, seedable PRNG returning floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRng(input: string): () => number {
  return mulberry32(hashSeed(input));
}

/** Pick n distinct items from a list using the provided rng. */
export function pickDistinct<T>(items: readonly T[], n: number, rng: () => number): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length);
    const [picked] = pool.splice(idx, 1);
    if (picked !== undefined) out.push(picked);
  }
  return out;
}
