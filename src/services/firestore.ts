import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../../firebase.config';
import type { Habit, UserProfile } from '../types';

/**
 * All user data lives under users/{uid}:
 *   users/{uid}            → UserProfile (XP, streaks, character, skills…)
 *   users/{uid}/habits/{id} → Habit documents
 */

export function userDocPath(uid: string): string[] {
  return ['users', uid];
}

function userRef(uid: string) {
  return doc(db, 'users', uid);
}

function habitRef(uid: string, habitId: string) {
  return doc(db, 'users', uid, 'habits', habitId);
}

function habitsCollection(uid: string) {
  return collection(db, 'users', uid, 'habits');
}

export async function writeProfile(uid: string, profile: UserProfile): Promise<void> {
  await setDoc(userRef(uid), profile, { merge: true });
}

export async function fetchProfileOnce(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function writeHabit(uid: string, habit: Habit): Promise<void> {
  await setDoc(habitRef(uid, habit.id), habit, { merge: true });
}

export async function deleteHabitRemote(uid: string, habitId: string): Promise<void> {
  await deleteDoc(habitRef(uid, habitId));
}

export interface WatchHandlers {
  onProfile: (profile: UserProfile | null) => void;
  onHabits: (habits: Habit[]) => void;
  onError: (error: Error) => void;
}

/** Real-time sync of the user's profile document and habits collection. */
export function watchUserData(uid: string, handlers: WatchHandlers): Unsubscribe {
  const unsubProfile = onSnapshot(
    userRef(uid),
    (snap) => {
      handlers.onProfile(snap.exists() ? (snap.data() as UserProfile) : null);
    },
    (err) => handlers.onError(err),
  );
  const unsubHabits = onSnapshot(
    habitsCollection(uid),
    (snap) => {
      const habits: Habit[] = [];
      snap.forEach((docSnap) => {
        habits.push(docSnap.data() as Habit);
      });
      habits.sort((a, b) => a.createdAt - b.createdAt);
      handlers.onHabits(habits);
    },
    (err) => handlers.onError(err),
  );
  return () => {
    unsubProfile();
    unsubHabits();
  };
}
