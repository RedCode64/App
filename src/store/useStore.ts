import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase.config';
import type {
  ComboState,
  CosmeticSlot,
  Habit,
  HabitCategory,
  Frequency,
  IdleMissionReport,
  UserProfile,
} from '../types';
import { COSMETICS, cosmeticById } from '../data/cosmetics';
import { SKILL_TREE, skillById } from '../data/skillTree';
import { pendingAchievements } from '../data/achievements';
import { calculateCompletionXp, levelFromXp } from '../utils/xp';
import { comboMultiplier, nextCombo } from '../utils/combo';
import {
  advanceGlobalStreak,
  evaluateGlobalStreak,
  habitStreak,
  streakBonusXp,
} from '../utils/streaks';
import { aggregateSkillEffects, canUnlockSkill } from '../utils/skills';
import { prestigeBonus, applyPrestige, canPrestige } from '../utils/prestige';
import { calculateIdleMissions, MAX_STREAK_SHIELDS } from '../utils/idleMissions';
import { equippedGearMultiplier } from '../utils/gear';
import { generateDailyChallenges, isChallengeMet } from '../utils/challenges';
import { todayKey } from '../utils/dates';
import { makeId } from '../utils/id';
import {
  logInUser,
  logOutUser,
  mapAuthError,
  requestPasswordReset,
  signUpUser,
  type SignUpInput,
} from '../services/auth';
import {
  deleteHabitRemote,
  watchUserData,
  writeHabit,
  writeProfile,
} from '../services/firestore';
import {
  clearUserCache,
  loadCachedHabits,
  loadCachedProfile,
  loadPendingOps,
  mergePendingOp,
  saveCachedHabits,
  saveCachedProfile,
  savePendingOps,
  type PendingOp,
} from '../services/cache';

const MAX_COMPLETED_DATES = 400;
const MAX_MISSION_LOG = 30;

export interface ToastMessage {
  id: number;
  kind: 'info' | 'success' | 'error';
  text: string;
}

export interface CompletionResult {
  xpGained: number;
  leveledUp: boolean;
  comboCount: number;
}

interface StoreState {
  user: { uid: string; email: string } | null;
  authInitialized: boolean;
  profile: UserProfile | null;
  habits: Habit[];
  hydrated: boolean;
  combo: ComboState;
  bestComboToday: { dateKey: string; value: number };
  syncError: string | null;
  online: boolean;
  toast: ToastMessage | null;
  levelUp: { level: number } | null;
  glitch: { message: string } | null;
  idleReport: IdleMissionReport | null;

  initAuth: () => () => void;
  signUp: (input: SignUpInput) => Promise<void>;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;

  createHabit: (input: {
    name: string;
    description: string;
    category: HabitCategory;
    frequency: Frequency;
  }) => Promise<void>;
  updateHabit: (
    id: string,
    patch: Partial<Pick<Habit, 'name' | 'description' | 'category' | 'frequency'>>,
  ) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabit: (id: string, nowMs?: number) => Promise<CompletionResult | null>;

  unlockSkill: (id: string) => Promise<boolean>;
  equipCosmetic: (slot: CosmeticSlot, cosmeticId: string | null) => Promise<void>;
  craftCosmetic: (cosmeticId: string) => Promise<boolean>;
  updateAppearance: (patch: Partial<UserProfile['character']['appearance']>) => Promise<void>;
  renameCharacter: (name: string) => Promise<void>;
  doPrestige: () => Promise<boolean>;
  updateSettings: (patch: Partial<UserProfile['settings']>) => Promise<void>;

  runSessionCheck: (nowMs?: number) => Promise<void>;
  recordHeartbeat: (nowMs?: number) => Promise<void>;
  flushPending: () => Promise<void>;
  retrySync: () => void;

  showToast: (text: string, kind?: ToastMessage['kind']) => void;
  clearToast: () => void;
  dismissLevelUp: () => void;
  dismissGlitch: () => void;
  dismissIdleReport: () => void;
}

let unsubscribeSync: (() => void) | null = null;
let toastCounter = 0;

/** Apply XP, recompute level, grant skill points / shields for level-ups. */
function applyXpGain(
  profile: UserProfile,
  amount: number,
): { profile: UserProfile; levelsGained: number } {
  const effects = aggregateSkillEffects(SKILL_TREE, profile.unlockedSkills);
  const xp = profile.xp + Math.max(0, Math.round(amount));
  const newLevel = levelFromXp(xp);
  const levelsGained = Math.max(0, newLevel - profile.level);
  let streakShields = profile.streakShields;
  if (levelsGained > 0 && effects.shieldOnLevelUp) {
    streakShields = Math.min(MAX_STREAK_SHIELDS, streakShields + levelsGained);
  }
  return {
    profile: {
      ...profile,
      xp,
      level: newLevel,
      skillPoints: profile.skillPoints + levelsGained,
      streakShields,
    },
    levelsGained,
  };
}

/** Auto-grant any cosmetics whose non-craft unlock conditions are now met. */
function applyCosmeticUnlocks(profile: UserProfile): { profile: UserProfile; unlockedNames: string[] } {
  const owned = new Set(profile.character.inventory);
  const unlockedNames: string[] = [];
  const newIds: string[] = [];
  for (const cosmetic of COSMETICS) {
    if (owned.has(cosmetic.id)) continue;
    const cond = cosmetic.unlock;
    const met =
      (cond.type === 'level' && profile.level >= cond.level) ||
      (cond.type === 'streak' && profile.globalStreak.best >= cond.days) ||
      (cond.type === 'prestige' && profile.prestigeCount >= cond.count) ||
      (cond.type === 'achievement' && profile.achievements.includes(cond.achievementId));
    if (met) {
      newIds.push(cosmetic.id);
      unlockedNames.push(cosmetic.name);
    }
  }
  if (newIds.length === 0) return { profile, unlockedNames };
  return {
    profile: {
      ...profile,
      character: {
        ...profile.character,
        inventory: [...profile.character.inventory, ...newIds],
      },
    },
    unlockedNames,
  };
}

/** Grant qualifying achievements and their XP bonuses. */
function applyAchievements(profile: UserProfile, habitCount: number): { profile: UserProfile; names: string[] } {
  let current = profile;
  const names: string[] = [];
  // Loop because an achievement's bonus XP can qualify a level achievement.
  for (let pass = 0; pass < 3; pass++) {
    const pending = pendingAchievements(current, habitCount);
    if (pending.length === 0) break;
    for (const a of pending) {
      names.push(a.name);
      current = { ...current, achievements: [...current.achievements, a.id] };
      if (a.bonusXp > 0) {
        current = applyXpGain(current, a.bonusXp).profile;
      }
    }
  }
  return { profile: current, names };
}

export const useStore = create<StoreState>()((set, get) => {
  async function persistProfile(profile: UserProfile): Promise<void> {
    const { user } = get();
    if (!user) return;
    set({ profile });
    await saveCachedProfile(user.uid, profile);
    try {
      await writeProfile(user.uid, profile);
      set({ online: true });
    } catch {
      const ops = await loadPendingOps(user.uid);
      await savePendingOps(user.uid, mergePendingOp(ops, { kind: 'profile' }));
      set({ online: false });
      get().showToast('OFFLINE // changes queued for sync', 'error');
    }
  }

  async function persistHabit(habit: Habit): Promise<void> {
    const { user } = get();
    if (!user) return;
    const habits = get().habits.some((h) => h.id === habit.id)
      ? get().habits.map((h) => (h.id === habit.id ? habit : h))
      : [...get().habits, habit];
    set({ habits });
    await saveCachedHabits(user.uid, habits);
    try {
      await writeHabit(user.uid, habit);
      set({ online: true });
    } catch {
      const ops = await loadPendingOps(user.uid);
      await savePendingOps(user.uid, mergePendingOp(ops, { kind: 'habit-set', habitId: habit.id }));
      set({ online: false });
      get().showToast('OFFLINE // changes queued for sync', 'error');
    }
  }

  function startSync(uid: string): void {
    unsubscribeSync?.();
    unsubscribeSync = watchUserData(uid, {
      onProfile: (profile) => {
        if (profile) {
          set({ profile, hydrated: true, syncError: null, online: true });
          void saveCachedProfile(uid, profile);
        }
      },
      onHabits: (habits) => {
        set({ habits, hydrated: true, syncError: null, online: true });
        void saveCachedHabits(uid, habits);
      },
      onError: (err) => {
        set({ syncError: err.message || 'Realtime uplink failed.', online: false });
      },
    });
  }

  async function hydrateFromCache(uid: string): Promise<void> {
    const [profile, habits] = await Promise.all([loadCachedProfile(uid), loadCachedHabits(uid)]);
    set((state) => ({
      profile: state.profile ?? profile,
      habits: state.habits.length > 0 ? state.habits : habits ?? [],
      hydrated: state.hydrated || profile !== null,
    }));
  }

  return {
    user: null,
    authInitialized: false,
    profile: null,
    habits: [],
    hydrated: false,
    combo: { count: 0, lastAt: null },
    bestComboToday: { dateKey: '', value: 0 },
    syncError: null,
    online: true,
    toast: null,
    levelUp: null,
    glitch: null,
    idleReport: null,

    initAuth: () => {
      const unsub = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          set({
            user: { uid: fbUser.uid, email: fbUser.email ?? '' },
            authInitialized: true,
          });
          void hydrateFromCache(fbUser.uid).then(() => {
            startSync(fbUser.uid);
            void get().flushPending();
          });
        } else {
          unsubscribeSync?.();
          unsubscribeSync = null;
          set({
            user: null,
            authInitialized: true,
            profile: null,
            habits: [],
            hydrated: false,
            combo: { count: 0, lastAt: null },
            levelUp: null,
            idleReport: null,
            glitch: null,
            syncError: null,
          });
        }
      });
      return unsub;
    },

    signUp: async (input) => {
      try {
        await signUpUser(input);
      } catch (err) {
        throw new Error(mapAuthError(err));
      }
    },

    logIn: async (email, password) => {
      try {
        await logInUser(email, password);
      } catch (err) {
        throw new Error(mapAuthError(err));
      }
    },

    logOut: async () => {
      const { user, profile } = get();
      if (user && profile) {
        // Best-effort heartbeat so Ghost Protocol measures away time from now.
        try {
          await writeProfile(user.uid, { ...profile, lastSessionTimestamp: Date.now() });
        } catch {
          // If offline, the cached timestamp already covers it.
        }
        await clearUserCache(user.uid);
      }
      await logOutUser();
    },

    resetPassword: async (email) => {
      try {
        await requestPasswordReset(email);
      } catch (err) {
        throw new Error(mapAuthError(err));
      }
    },

    createHabit: async (input) => {
      const habit: Habit = {
        id: makeId('habit'),
        name: input.name.trim(),
        description: input.description.trim(),
        category: input.category,
        frequency: input.frequency,
        createdAt: Date.now(),
        completedDates: [],
        bestStreak: 0,
      };
      await persistHabit(habit);
      const { profile } = get();
      if (profile) {
        const achieved = applyAchievements(profile, get().habits.length);
        if (achieved.names.length > 0) {
          get().showToast(`IMPLANT EARNED // ${achieved.names.join(', ')}`, 'success');
          const unlocks = applyCosmeticUnlocks(achieved.profile);
          if (unlocks.unlockedNames.length > 0) {
            get().showToast(`GEAR ACQUIRED // ${unlocks.unlockedNames.join(', ')}`, 'success');
          }
          await persistProfile(unlocks.profile);
        }
      }
    },

    updateHabit: async (id, patch) => {
      const habit = get().habits.find((h) => h.id === id);
      if (!habit) return;
      await persistHabit({ ...habit, ...patch });
    },

    deleteHabit: async (id) => {
      const { user } = get();
      if (!user) return;
      const habits = get().habits.filter((h) => h.id !== id);
      set({ habits });
      await saveCachedHabits(user.uid, habits);
      try {
        await deleteHabitRemote(user.uid, id);
        set({ online: true });
      } catch {
        const ops = await loadPendingOps(user.uid);
        await savePendingOps(user.uid, mergePendingOp(ops, { kind: 'habit-delete', habitId: id }));
        set({ online: false });
        get().showToast('OFFLINE // deletion queued for sync', 'error');
      }
    },

    completeHabit: async (id, nowMs) => {
      const { profile, habits } = get();
      if (!profile) return null;
      const habit = habits.find((h) => h.id === id);
      if (!habit) return null;

      const now = nowMs ?? Date.now();
      const today = todayKey(new Date(now));
      if (habit.completedDates.includes(today)) {
        get().showToast('Contract already closed this cycle.', 'info');
        return null;
      }

      const effects = aggregateSkillEffects(SKILL_TREE, profile.unlockedSkills);
      const combo = nextCombo(get().combo, now, effects.comboWindowMs);
      const mult = comboMultiplier(combo.count, effects.comboCap);

      const completedDates = [...habit.completedDates, today].slice(-MAX_COMPLETED_DATES);
      const updatedHabit: Habit = { ...habit, completedDates };
      const streak = habitStreak(updatedHabit, new Date(now));
      updatedHabit.bestStreak = Math.max(habit.bestStreak, streak);

      const xpGained = calculateCompletionXp({
        comboMultiplier: mult,
        prestigeBonus: prestigeBonus(profile.prestigeCount),
        skillXpMultiplier: effects.xpMultiplier,
        streakBonus: streakBonusXp(streak),
      });

      const prevLevel = profile.level;
      let next: UserProfile = {
        ...profile,
        totalCompletions: profile.totalCompletions + 1,
        bestCombo: Math.max(profile.bestCombo, combo.count),
        globalStreak: advanceGlobalStreak(profile.globalStreak, new Date(now)),
      };
      next = applyXpGain(next, xpGained).profile;

      // Daily challenge evaluation against the post-completion state.
      const bestComboToday =
        get().bestComboToday.dateKey === today
          ? { dateKey: today, value: Math.max(get().bestComboToday.value, combo.count) }
          : { dateKey: today, value: combo.count };
      const challengeState =
        next.challenges.dateKey === today ? next.challenges : { dateKey: today, completedIds: [] };
      const updatedHabits = habits.map((h) => (h.id === id ? updatedHabit : h));
      const ctx = {
        habits: updatedHabits,
        todayKey: today,
        comboCount: combo.count,
        bestComboToday: bestComboToday.value,
      };
      const completedIds = [...challengeState.completedIds];
      const newlyMet = generateDailyChallenges(get().user?.uid ?? '', today).filter(
        (c) => !completedIds.includes(c.id) && isChallengeMet(c, ctx),
      );
      for (const c of newlyMet) {
        completedIds.push(c.id);
        next = applyXpGain(next, c.bonusXp).profile;
        next = { ...next, challengesCompleted: next.challengesCompleted + 1 };
        get().showToast(`MISSION COMPLETE // ${c.title} +${c.bonusXp} XP`, 'success');
      }
      next = { ...next, challenges: { dateKey: today, completedIds } };

      const achieved = applyAchievements(next, updatedHabits.length);
      next = achieved.profile;
      if (achieved.names.length > 0) {
        get().showToast(`IMPLANT EARNED // ${achieved.names.join(', ')}`, 'success');
      }

      const unlocks = applyCosmeticUnlocks(next);
      next = unlocks.profile;
      if (unlocks.unlockedNames.length > 0) {
        get().showToast(`GEAR ACQUIRED // ${unlocks.unlockedNames.join(', ')}`, 'success');
      }

      const leveledUp = next.level > prevLevel;
      set({
        combo,
        bestComboToday,
        ...(leveledUp ? { levelUp: { level: next.level } } : {}),
      });

      await persistHabit(updatedHabit);
      await persistProfile(next);

      return { xpGained, leveledUp, comboCount: combo.count };
    },

    unlockSkill: async (id) => {
      const { profile } = get();
      if (!profile) return false;
      const node = skillById(id);
      if (!node) return false;
      const check = canUnlockSkill(node, profile.unlockedSkills, profile.skillPoints);
      if (!check.ok) {
        get().showToast(check.reason ?? 'Cannot install implant.', 'error');
        return false;
      }
      let next: UserProfile = {
        ...profile,
        skillPoints: profile.skillPoints - node.cost,
        unlockedSkills: [...profile.unlockedSkills, node.id],
      };
      if (node.effect.type === 'shield') {
        next = {
          ...next,
          streakShields: Math.min(MAX_STREAK_SHIELDS, next.streakShields + node.effect.value),
        };
      }
      const achieved = applyAchievements(next, get().habits.length);
      next = achieved.profile;
      if (achieved.names.length > 0) {
        get().showToast(`IMPLANT EARNED // ${achieved.names.join(', ')}`, 'success');
      }
      next = applyCosmeticUnlocks(next).profile;
      await persistProfile(next);
      get().showToast(`INSTALLED // ${node.name}`, 'success');
      return true;
    },

    equipCosmetic: async (slot, cosmeticId) => {
      const { profile } = get();
      if (!profile) return;
      if (cosmeticId !== null) {
        const cosmetic = cosmeticById(cosmeticId);
        if (!cosmetic || cosmetic.slot !== slot || !profile.character.inventory.includes(cosmeticId)) {
          get().showToast('Gear not in inventory.', 'error');
          return;
        }
      }
      await persistProfile({
        ...profile,
        character: {
          ...profile.character,
          equipped: { ...profile.character.equipped, [slot]: cosmeticId },
        },
      });
    },

    craftCosmetic: async (cosmeticId) => {
      const { profile } = get();
      if (!profile) return false;
      const cosmetic = cosmeticById(cosmeticId);
      if (!cosmetic || cosmetic.unlock.type !== 'fragments') return false;
      if (profile.character.inventory.includes(cosmeticId)) return false;
      if (profile.fragments < cosmetic.unlock.cost) {
        get().showToast('Not enough fragments.', 'error');
        return false;
      }
      let next: UserProfile = {
        ...profile,
        fragments: profile.fragments - cosmetic.unlock.cost,
        character: {
          ...profile.character,
          inventory: [...profile.character.inventory, cosmeticId],
        },
      };
      next = applyAchievements(next, get().habits.length).profile;
      await persistProfile(next);
      get().showToast(`FABRICATED // ${cosmetic.name}`, 'success');
      return true;
    },

    updateAppearance: async (patch) => {
      const { profile } = get();
      if (!profile) return;
      await persistProfile({
        ...profile,
        character: {
          ...profile.character,
          appearance: { ...profile.character.appearance, ...patch },
        },
      });
    },

    renameCharacter: async (name) => {
      const { profile } = get();
      if (!profile || name.trim().length === 0) return;
      await persistProfile({
        ...profile,
        character: { ...profile.character, name: name.trim() },
      });
    },

    doPrestige: async () => {
      const { profile } = get();
      if (!profile || !canPrestige(profile.level)) return false;
      let next = applyPrestige(profile);
      const achieved = applyAchievements(next, get().habits.length);
      next = achieved.profile;
      next = applyCosmeticUnlocks(next).profile;
      await persistProfile(next);
      get().showToast(
        `REBIRTH COMPLETE // permanent +${Math.round(prestigeBonus(next.prestigeCount) * 100)}% XP`,
        'success',
      );
      return true;
    },

    updateSettings: async (patch) => {
      const { profile } = get();
      if (!profile) return;
      await persistProfile({ ...profile, settings: { ...profile.settings, ...patch } });
    },

    runSessionCheck: async (nowMs) => {
      const { profile, user } = get();
      if (!profile || !user) return;
      const now = nowMs ?? Date.now();
      const nowDate = new Date(now);
      const today = todayKey(nowDate);
      let next = profile;
      let dirty = false;

      // 1. Refresh daily challenges at day rollover.
      if (next.challenges.dateKey !== today) {
        next = { ...next, challenges: { dateKey: today, completedIds: [] } };
        dirty = true;
      }

      // 2. Streak survival check (shields absorb a missed day).
      const evaluation = evaluateGlobalStreak(next.globalStreak, next.streakShields, nowDate);
      if (evaluation.shieldsConsumed > 0) {
        next = {
          ...next,
          globalStreak: evaluation.streak,
          streakShields: next.streakShields - evaluation.shieldsConsumed,
        };
        dirty = true;
        get().showToast('STREAK SHIELD BURNED // chain preserved', 'info');
      } else if (evaluation.broken) {
        next = { ...next, globalStreak: evaluation.streak };
        dirty = true;
        set({ glitch: { message: 'SIGNAL CORRUPTED // STREAK LOST' } });
      }

      // 3. Ghost Protocol — idle missions run while the user was away.
      const effects = aggregateSkillEffects(SKILL_TREE, next.unlockedSkills);
      const gearMult = equippedGearMultiplier(next.character.equipped, COSMETICS);
      const report = calculateIdleMissions({
        uid: user.uid,
        lastSessionTimestamp: next.lastSessionTimestamp,
        now,
        gearMultiplier: gearMult,
        prestigeBonus: prestigeBonus(next.prestigeCount),
        idleMultiplier: effects.idleMultiplier,
        fragmentBonus: effects.fragmentBonus,
      });
      if (report) {
        const prevLevel = next.level;
        next = applyXpGain(next, report.totalXp).profile;
        next = {
          ...next,
          fragments: next.fragments + report.totalFragments,
          streakShields: Math.min(MAX_STREAK_SHIELDS, next.streakShields + report.shieldsGained),
          idleMissionLog: [...report.missions, ...next.idleMissionLog].slice(0, MAX_MISSION_LOG),
        };
        next = applyCosmeticUnlocks(next).profile;
        set({
          idleReport: report,
          ...(next.level > prevLevel ? { levelUp: { level: next.level } } : {}),
        });
        dirty = true;
      }

      if (next.lastSessionTimestamp !== now) {
        next = { ...next, lastSessionTimestamp: now };
        dirty = true;
      }
      if (dirty) {
        await persistProfile(next);
      }
    },

    recordHeartbeat: async (nowMs) => {
      const { profile } = get();
      if (!profile) return;
      await persistProfile({ ...profile, lastSessionTimestamp: nowMs ?? Date.now() });
    },

    flushPending: async () => {
      const { user } = get();
      if (!user) return;
      const ops = await loadPendingOps(user.uid);
      if (ops.length === 0) return;
      const remaining: PendingOp[] = [];
      for (const op of ops) {
        try {
          if (op.kind === 'profile') {
            const profile = get().profile;
            if (profile) await writeProfile(user.uid, profile);
          } else if (op.kind === 'habit-set') {
            const habit = get().habits.find((h) => h.id === op.habitId);
            if (habit) await writeHabit(user.uid, habit);
          } else {
            await deleteHabitRemote(user.uid, op.habitId);
          }
        } catch {
          remaining.push(op);
        }
      }
      await savePendingOps(user.uid, remaining);
      if (remaining.length === 0 && ops.length > 0) {
        set({ online: true });
        get().showToast('UPLINK RESTORED // all changes synced', 'success');
      }
    },

    retrySync: () => {
      const { user } = get();
      if (!user) return;
      set({ syncError: null });
      startSync(user.uid);
      void get().flushPending();
    },

    showToast: (text, kind = 'info') => {
      toastCounter += 1;
      set({ toast: { id: toastCounter, text, kind } });
    },
    clearToast: () => set({ toast: null }),
    dismissLevelUp: () => set({ levelUp: null }),
    dismissGlitch: () => set({ glitch: null }),
    dismissIdleReport: () => set({ idleReport: null }),
  };
});

/** Derived helpers used by multiple screens. */
export function selectGearMultiplier(profile: UserProfile | null): number {
  if (!profile) return 1;
  return equippedGearMultiplier(profile.character.equipped, COSMETICS);
}
