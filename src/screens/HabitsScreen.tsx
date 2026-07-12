import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { categoryColors, categoryLabels, colors, fonts } from '../theme';
import { AnimatedGridBackground } from '../components/AnimatedGridBackground';
import { ScreenHeader } from '../components/ScreenHeader';
import { HabitCard } from '../components/HabitCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { ErrorState } from '../components/ErrorState';
import { useStore } from '../store/useStore';
import { completionFx } from '../services/fx';
import type { Habit, HabitCategory } from '../types';
import type { ContractsStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<ContractsStackParamList, 'ContractList'>;

const FILTERS: (HabitCategory | 'all')[] = ['all', 'body', 'mind', 'grind', 'social'];

export function HabitsScreen({ navigation }: Props) {
  const habits = useStore((s) => s.habits);
  const hydrated = useStore((s) => s.hydrated);
  const syncError = useStore((s) => s.syncError);
  const retrySync = useStore((s) => s.retrySync);
  const completeHabit = useStore((s) => s.completeHabit);
  const profile = useStore((s) => s.profile);
  const [filter, setFilter] = useState<HabitCategory | 'all'>('all');

  const filtered = filter === 'all' ? habits : habits.filter((h) => h.category === filter);

  const handleComplete = (id: string) => {
    void completionFx(profile?.settings.soundEnabled ?? true);
    void completeHabit(id);
  };

  const openForm = (habit?: Habit) => {
    navigation.navigate('ContractForm', habit ? { habitId: habit.id } : {});
  };

  return (
    <View style={styles.container}>
      <AnimatedGridBackground />
      <ScreenHeader
        title="CONTRACTS"
        right={
          <View style={styles.headerActions}>
            <Pressable onPress={() => navigation.navigate('History')} hitSlop={10}>
              <Ionicons name="calendar" size={20} color={colors.textDim} />
            </Pressable>
            <Pressable onPress={() => openForm()} hitSlop={10}>
              <Ionicons name="add-circle" size={24} color={colors.cyan} />
            </Pressable>
          </View>
        }
      />

      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f;
          const color = f === 'all' ? colors.text : categoryColors[f];
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, active && { borderColor: color }]}
            >
              <Text style={[styles.filterText, active && { color }]}>
                {f === 'all' ? 'ALL DISTRICTS' : categoryLabels[f]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!hydrated ? (
        syncError ? (
          <ErrorState message={syncError} onRetry={retrySync} />
        ) : (
          <View style={styles.list}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </View>
        )
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(h) => h.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={syncError ? <ErrorState message={syncError} onRetry={retrySync} /> : null}
          ListEmptyComponent={
            <View style={styles.emptyBlock}>
              <Ionicons name="document-text" size={36} color={colors.textFaint} />
              <Text style={styles.emptyText}>
                No contracts on file{filter !== 'all' ? ' in this district' : ''}. Hit the + to register one.
              </Text>
            </View>
          }
          renderItem={({ item }) => <HabitCard habit={item} onComplete={handleComplete} onPress={openForm} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  filterText: {
    fontFamily: fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: colors.textFaint,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyBlock: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 60,
  },
  emptyText: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 30,
  },
});
