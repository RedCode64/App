import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, fonts } from '../theme';
import { AnimatedGridBackground } from '../components/AnimatedGridBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { XPBar } from '../components/XPBar';
import { AvatarRig } from '../components/AvatarRig';
import { HabitCard } from '../components/HabitCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { ErrorState } from '../components/ErrorState';
import { useStore } from '../store/useStore';
import { completionFx } from '../services/fx';
import { generateDailyChallenges, challengeProgress } from '../utils/challenges';
import { todayKey } from '../utils/dates';
import { isDueToday } from '../utils/dates';
import type { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Dashboard'>;

export function HomeScreen({ navigation }: Props) {
  const profile = useStore((s) => s.profile);
  const habits = useStore((s) => s.habits);
  const hydrated = useStore((s) => s.hydrated);
  const syncError = useStore((s) => s.syncError);
  const retrySync = useStore((s) => s.retrySync);
  const completeHabit = useStore((s) => s.completeHabit);
  const runSessionCheck = useStore((s) => s.runSessionCheck);
  const user = useStore((s) => s.user);
  const combo = useStore((s) => s.combo);
  const bestComboToday = useStore((s) => s.bestComboToday);
  const [refreshing, setRefreshing] = useState(false);

  const today = todayKey();

  if (!hydrated || !profile) {
    return (
      <View style={styles.container}>
        <AnimatedGridBackground />
        <ScreenHeader title="GRIDRUNNER" />
        {syncError ? (
          <ErrorState message={syncError} onRetry={retrySync} />
        ) : (
          <View style={styles.skeletons}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        )}
      </View>
    );
  }

  const dueToday = habits.filter((h) => isDueToday(h));
  const doneToday = dueToday.filter((h) => h.completedDates.includes(today));
  const completionRate = dueToday.length === 0 ? 0 : Math.round((doneToday.length / dueToday.length) * 100);
  const pending = dueToday.filter((h) => !h.completedDates.includes(today));

  const challenges = generateDailyChallenges(user?.uid ?? '', today);
  const completedChallengeIds =
    profile.challenges.dateKey === today ? profile.challenges.completedIds : [];
  const challengeCtx = {
    habits,
    todayKey: today,
    comboCount: combo.count,
    bestComboToday: bestComboToday.dateKey === today ? bestComboToday.value : 0,
  };

  const handleComplete = (id: string) => {
    void completionFx(profile.settings.soundEnabled);
    void completeHabit(id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    retrySync();
    await runSessionCheck();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <AnimatedGridBackground />
      <ScreenHeader
        title="GRIDRUNNER"
        right={
          <Pressable onPress={() => navigation.navigate('Profile')} hitSlop={10}>
            <Ionicons name="settings-sharp" size={20} color={colors.textDim} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.cyan} />}
      >
        {syncError ? <ErrorState message={syncError} onRetry={retrySync} /> : null}

        <View style={styles.heroCard}>
          <AvatarRig character={profile.character} size={92} />
          <View style={styles.heroBody}>
            <Text style={styles.runnerName}>{profile.character.name.toUpperCase()}</Text>
            <XPBar xp={profile.xp} prestigeCount={profile.prestigeCount} />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatTile label="TODAY" value={`${completionRate}%`} color={colors.cyan} />
          <StatTile label="STREAK" value={`${profile.globalStreak.count}d`} color={colors.orange} />
          <StatTile label="SHIELDS" value={`${profile.streakShields}`} color={colors.green} />
          <StatTile label="FRAGMENTS" value={`${profile.fragments}`} color={colors.magenta} />
        </View>

        {combo.count > 1 && (
          <View style={styles.comboBanner}>
            <Ionicons name="flash" size={14} color={colors.yellow} />
            <Text style={styles.comboText}>COMBO ×{combo.count} ACTIVE — KEEP THE CHAIN ALIVE</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>▚ INCOMING MISSIONS — REFRESH AT 00:00</Text>
        {challenges.map((c) => {
          const done = completedChallengeIds.includes(c.id);
          const progress = Math.min(challengeProgress(c, challengeCtx), c.target);
          return (
            <View key={c.id} style={[styles.challengeCard, done && styles.challengeDone]}>
              <View style={styles.challengeHeader}>
                <Text style={[styles.challengeTitle, done && { color: colors.green }]}>
                  {done ? '✓ ' : ''}
                  {c.title}
                </Text>
                <Text style={styles.challengeXp}>+{c.bonusXp} XP</Text>
              </View>
              <Text style={styles.challengeDesc}>{c.description}</Text>
              <Text style={styles.challengeProgress}>
                {done ? 'MISSION COMPLETE' : `PROGRESS ${progress}/${c.target}`}
              </Text>
            </View>
          );
        })}

        <Text style={styles.sectionTitle}>▚ OPEN CONTRACTS — DUE THIS CYCLE</Text>
        {dueToday.length === 0 ? (
          <Text style={styles.empty}>
            No contracts registered. Head to the CONTRACTS district and take on your first job.
          </Text>
        ) : pending.length === 0 ? (
          <Text style={[styles.empty, { color: colors.green }]}>
            ALL CONTRACTS CLOSED. THE CITY REMEMBERS, RUNNER.
          </Text>
        ) : (
          pending.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onComplete={handleComplete} onPress={() => {}} />
          ))
        )}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

function StatTile({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statTile, { borderColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  skeletons: {
    padding: 20,
  },
  scroll: {
    padding: 20,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderBright,
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },
  heroBody: {
    flex: 1,
    gap: 10,
  },
  runnerName: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 2,
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 16,
  },
  statLabel: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: colors.textFaint,
    marginTop: 2,
  },
  comboBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.yellow,
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
    backgroundColor: '#f5f74910',
  },
  comboText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.yellow,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textDim,
    marginBottom: 10,
    marginTop: 8,
  },
  challengeCard: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
    gap: 4,
  },
  challengeDone: {
    borderColor: colors.green,
    opacity: 0.75,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  challengeTitle: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
    color: colors.cyan,
  },
  challengeXp: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.yellow,
  },
  challengeDesc: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textDim,
  },
  challengeProgress: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.textFaint,
  },
  empty: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textDim,
    lineHeight: 18,
    marginBottom: 10,
  },
  bottomPad: {
    height: 40,
  },
});
