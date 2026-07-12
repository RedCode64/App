/**
 * Integration tests: exercise the real Zustand store and Firestore service
 * code paths against the in-memory firebase/AsyncStorage mocks (wired via
 * jest moduleNameMapper in package.json).
 */
import { useStore } from '../src/store/useStore';
import { buildInitialProfile } from '../src/utils/profile';
import { todayKey } from '../src/utils/dates';
import { watchUserData, writeHabit, writeProfile } from '../src/services/firestore';
import { loadCachedHabits, loadPendingOps } from '../src/services/cache';
import type { Habit, UserProfile } from '../src/types';
import { __getDoc, __resetFirestore, __setOffline } from '../__mocks__/firebase/firestore';
import AsyncStorageMock from '../__mocks__/async-storage';

const UID = 'u-test-1';

function freshState(): void {
  __resetFirestore();
  AsyncStorageMock.__reset();
  useStore.setState({
    user: { uid: UID, email: 'tester@night.city' },
    authInitialized: true,
    profile: buildInitialProfile('tester@night.city', 'TESTER'),
    habits: [],
    hydrated: true,
    combo: { count: 0, lastAt: null },
    bestComboToday: { dateKey: '', value: 0 },
    syncError: null,
    online: true,
    toast: null,
    levelUp: null,
    glitch: null,
    idleReport: null,
  });
}

async function createTestHabit(name = 'Morning run'): Promise<Habit> {
  await useStore.getState().createHabit({
    name,
    description: 'Through the sprawl',
    category: 'body',
    frequency: { type: 'daily' },
  });
  const habit = useStore.getState().habits.find((h) => h.name === name);
  expect(habit).toBeDefined();
  return habit as Habit;
}

beforeEach(freshState);

describe('habit CRUD → Firestore sync', () => {
  it('creates a habit locally, in the cache and in Firestore', async () => {
    const habit = await createTestHabit();

    expect(useStore.getState().habits).toHaveLength(1);

    const remote = __getDoc(`users/${UID}/habits/${habit.id}`);
    expect(remote).toBeDefined();
    expect(remote?.name).toBe('Morning run');

    const cached = await loadCachedHabits(UID);
    expect(cached?.map((h) => h.id)).toEqual([habit.id]);
  });

  it('grants the first-habit achievement and persists the profile', async () => {
    await createTestHabit();
    const profile = useStore.getState().profile as UserProfile;
    expect(profile.achievements).toContain('first_habit');
    const remoteProfile = __getDoc(`users/${UID}`) as unknown as UserProfile;
    expect(remoteProfile.achievements).toContain('first_habit');
  });

  it('updates a habit and syncs the change', async () => {
    const habit = await createTestHabit();
    await useStore.getState().updateHabit(habit.id, { name: 'Evening run', category: 'mind' });

    const updated = useStore.getState().habits[0] as Habit;
    expect(updated.name).toBe('Evening run');
    expect(updated.category).toBe('mind');

    const remote = __getDoc(`users/${UID}/habits/${habit.id}`);
    expect(remote?.name).toBe('Evening run');
  });

  it('deletes a habit locally and remotely', async () => {
    const habit = await createTestHabit();
    await useStore.getState().deleteHabit(habit.id);

    expect(useStore.getState().habits).toHaveLength(0);
    expect(__getDoc(`users/${UID}/habits/${habit.id}`)).toBeUndefined();
    expect(await loadCachedHabits(UID)).toEqual([]);
  });
});

describe('habit completion pipeline', () => {
  it('records the completion, grants XP and syncs both documents', async () => {
    const habit = await createTestHabit();
    const before = (useStore.getState().profile as UserProfile).xp;

    const result = await useStore.getState().completeHabit(habit.id);
    expect(result).not.toBeNull();
    expect(result?.xpGained).toBeGreaterThan(0);
    expect(result?.comboCount).toBe(1);

    const state = useStore.getState();
    const updated = state.habits[0] as Habit;
    expect(updated.completedDates).toContain(todayKey());

    const profile = state.profile as UserProfile;
    expect(profile.xp).toBeGreaterThan(before);
    expect(profile.totalCompletions).toBe(1);
    expect(profile.globalStreak.count).toBe(1);

    const remoteHabit = __getDoc(`users/${UID}/habits/${habit.id}`);
    expect(remoteHabit?.completedDates).toContain(todayKey());
    const remoteProfile = __getDoc(`users/${UID}`) as unknown as UserProfile;
    expect(remoteProfile.totalCompletions).toBe(1);
  });

  it('refuses a second completion on the same day', async () => {
    const habit = await createTestHabit();
    await useStore.getState().completeHabit(habit.id);
    const again = await useStore.getState().completeHabit(habit.id);
    expect(again).toBeNull();
    expect((useStore.getState().profile as UserProfile).totalCompletions).toBe(1);
  });

  it('chains combos across habits completed in sequence', async () => {
    const a = await createTestHabit('Habit A');
    const b = await createTestHabit('Habit B');
    const now = Date.now();
    const first = await useStore.getState().completeHabit(a.id, now);
    const second = await useStore.getState().completeHabit(b.id, now + 60_000);
    expect(first?.comboCount).toBe(1);
    expect(second?.comboCount).toBe(2);
    expect(second!.xpGained).toBeGreaterThan(first!.xpGained - 1);
  });
});

describe('offline queue → reconnect flush', () => {
  it('queues habit writes while offline and flushes them on reconnect', async () => {
    __setOffline(true);
    const habit = await createTestHabit();

    // Optimistic local state, no remote write, op queued.
    expect(useStore.getState().habits).toHaveLength(1);
    expect(__getDoc(`users/${UID}/habits/${habit.id}`)).toBeUndefined();
    expect(useStore.getState().online).toBe(false);
    const queued = await loadPendingOps(UID);
    expect(queued.some((op) => op.kind === 'habit-set' && op.habitId === habit.id)).toBe(true);

    __setOffline(false);
    await useStore.getState().flushPending();

    expect(__getDoc(`users/${UID}/habits/${habit.id}`)?.name).toBe('Morning run');
    expect(await loadPendingOps(UID)).toEqual([]);
    expect(useStore.getState().online).toBe(true);
  });

  it('queues profile writes while offline and flushes them on reconnect', async () => {
    __setOffline(true);
    await useStore.getState().updateSettings({ soundEnabled: false });

    expect((useStore.getState().profile as UserProfile).settings.soundEnabled).toBe(false);
    expect(__getDoc(`users/${UID}`)).toBeUndefined();

    __setOffline(false);
    await useStore.getState().flushPending();

    const remote = __getDoc(`users/${UID}`) as unknown as UserProfile;
    expect(remote.settings.soundEnabled).toBe(false);
  });
});

describe('real-time watch (onSnapshot wiring)', () => {
  it('delivers profile and habit snapshots and stops after unsubscribe', async () => {
    const profile = buildInitialProfile('w@x.io', 'WATCHER');
    await writeProfile(UID, profile);

    const profiles: (UserProfile | null)[] = [];
    const habitLists: Habit[][] = [];
    const unsubscribe = watchUserData(UID, {
      onProfile: (p) => profiles.push(p),
      onHabits: (h) => habitLists.push(h),
      onError: () => {
        throw new Error('watch errored');
      },
    });

    // Initial snapshots fire immediately.
    expect(profiles[0]?.character.name).toBe('WATCHER');
    expect(habitLists[0]).toEqual([]);

    const habit: Habit = {
      id: 'h-live',
      name: 'Live habit',
      description: '',
      category: 'grind',
      frequency: { type: 'daily' },
      createdAt: 1,
      completedDates: [],
      bestStreak: 0,
    };
    await writeHabit(UID, habit);
    expect(habitLists[habitLists.length - 1]?.map((h) => h.id)).toEqual(['h-live']);

    unsubscribe();
    const countAfterUnsub = habitLists.length;
    await writeHabit(UID, { ...habit, name: 'Changed' });
    expect(habitLists.length).toBe(countAfterUnsub);
  });
});

describe('Ghost Protocol session check', () => {
  it('applies idle rewards after a long gap and surfaces the debrief', async () => {
    const HOUR = 60 * 60 * 1000;
    const profile = useStore.getState().profile as UserProfile;
    useStore.setState({
      profile: { ...profile, lastSessionTimestamp: Date.now() - 12 * HOUR },
    });
    const xpBefore = (useStore.getState().profile as UserProfile).xp;

    await useStore.getState().runSessionCheck();

    const state = useStore.getState();
    expect(state.idleReport).not.toBeNull();
    expect(state.idleReport?.missions.length).toBeGreaterThan(0);
    const after = state.profile as UserProfile;
    expect(after.xp).toBeGreaterThan(xpBefore);
    expect(after.idleMissionLog.length).toBeGreaterThan(0);
    expect(Date.now() - after.lastSessionTimestamp).toBeLessThan(5_000);

    const remote = __getDoc(`users/${UID}`) as unknown as UserProfile;
    expect(remote.idleMissionLog.length).toBeGreaterThan(0);
  });

  it('does not fire for short gaps', async () => {
    const profile = useStore.getState().profile as UserProfile;
    useStore.setState({
      profile: { ...profile, lastSessionTimestamp: Date.now() - 30 * 60 * 1000 },
    });
    await useStore.getState().runSessionCheck();
    expect(useStore.getState().idleReport).toBeNull();
  });
});
