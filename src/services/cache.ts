import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit, UserProfile } from '../types';

/**
 * Optimistic local cache. Every state change lands here immediately so the
 * app keeps working through brief offline periods; Firestore writes that fail
 * are queued as PendingOps and flushed on reconnect.
 */

export type PendingOp =
  | { kind: 'profile' }
  | { kind: 'habit-set'; habitId: string }
  | { kind: 'habit-delete'; habitId: string };

const profileKey = (uid: string) => `gridrunner:profile:${uid}`;
const habitsKey = (uid: string) => `gridrunner:habits:${uid}`;
const pendingKey = (uid: string) => `gridrunner:pending:${uid}`;

export async function loadCachedProfile(uid: string): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(profileKey(uid));
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export async function saveCachedProfile(uid: string, profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(profileKey(uid), JSON.stringify(profile));
  } catch {
    // Cache write failures are non-fatal; Firestore remains source of truth.
  }
}

export async function loadCachedHabits(uid: string): Promise<Habit[] | null> {
  try {
    const raw = await AsyncStorage.getItem(habitsKey(uid));
    return raw ? (JSON.parse(raw) as Habit[]) : null;
  } catch {
    return null;
  }
}

export async function saveCachedHabits(uid: string, habits: Habit[]): Promise<void> {
  try {
    await AsyncStorage.setItem(habitsKey(uid), JSON.stringify(habits));
  } catch {
    // Non-fatal, see above.
  }
}

export async function loadPendingOps(uid: string): Promise<PendingOp[]> {
  try {
    const raw = await AsyncStorage.getItem(pendingKey(uid));
    return raw ? (JSON.parse(raw) as PendingOp[]) : [];
  } catch {
    return [];
  }
}

export async function savePendingOps(uid: string, ops: PendingOp[]): Promise<void> {
  try {
    await AsyncStorage.setItem(pendingKey(uid), JSON.stringify(ops));
  } catch {
    // Non-fatal, see above.
  }
}

/** Add an op, de-duplicating (one profile op max; one op per habit id). */
export function mergePendingOp(ops: PendingOp[], op: PendingOp): PendingOp[] {
  const filtered = ops.filter((existing) => {
    if (op.kind === 'profile') return existing.kind !== 'profile';
    return !('habitId' in existing) || existing.habitId !== op.habitId;
  });
  return [...filtered, op];
}

export async function clearUserCache(uid: string): Promise<void> {
  try {
    await AsyncStorage.multiRemove([profileKey(uid), habitsKey(uid), pendingKey(uid)]);
  } catch {
    // Non-fatal.
  }
}
