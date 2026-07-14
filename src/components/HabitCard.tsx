import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Habit } from '../types';
import { categoryColors, categoryLabels, colors, fonts } from '../theme';
import { frequencyLabel, todayKey } from '../utils/dates';
import { habitStreak } from '../utils/streaks';

interface HabitCardProps {
  habit: Habit;
  onComplete: (id: string) => void;
  onPress: (habit: Habit) => void;
}

/** A habit rendered as a contract dossier / mission brief. */
export function HabitCard({ habit, onComplete, onPress }: HabitCardProps) {
  const accent = categoryColors[habit.category];
  const doneToday = habit.completedDates.includes(todayKey());
  const streak = habitStreak(habit);

  const pulse = useSharedValue(1);
  const glow = useSharedValue(0);

  const handleComplete = () => {
    if (doneToday) return;
    pulse.value = withSequence(withSpring(1.35, { damping: 4 }), withSpring(1));
    glow.value = withSequence(withTiming(1, { duration: 120 }), withTiming(0, { duration: 700 }));
    onComplete(habit.id);
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <Pressable onPress={() => onPress(habit)} style={({ pressed }) => [styles.card, { borderLeftColor: accent }, pressed && styles.pressed]}>
      <Animated.View pointerEvents="none" style={[styles.glowLayer, { backgroundColor: accent }, glowStyle]} />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={[styles.district, { color: accent }]}>{categoryLabels[habit.category]}</Text>
          <Text style={styles.frequency}>{frequencyLabel(habit.frequency)}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {habit.name}
        </Text>
        {habit.description.length > 0 && (
          <Text style={styles.description} numberOfLines={2}>
            {habit.description}
          </Text>
        )}
        <View style={styles.footerRow}>
          <Text style={styles.streak}>
            <Ionicons name="flame" size={11} color={streak > 0 ? colors.orange : colors.textFaint} /> {streak} STREAK
          </Text>
          <Text style={styles.best}>BEST {habit.bestStreak}</Text>
        </View>
      </View>
      <Animated.View style={buttonStyle}>
        <Pressable
          onPress={handleComplete}
          disabled={doneToday}
          hitSlop={8}
          style={[styles.completeBtn, { borderColor: doneToday ? colors.green : accent }, doneToday && styles.completeDone]}
        >
          <Ionicons name={doneToday ? 'checkmark' : 'flash'} size={22} color={doneToday ? colors.green : accent} />
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.8,
  },
  glowLayer: {
    ...StyleSheet.absoluteFill,
    opacity: 0,
  },
  body: {
    flex: 1,
    marginRight: 12,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  district: {
    fontFamily: fonts.mono,
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
  },
  frequency: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.textFaint,
    letterSpacing: 1,
  },
  name: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 15,
    color: colors.text,
    letterSpacing: 1,
  },
  description: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textDim,
    lineHeight: 15,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 2,
  },
  streak: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textDim,
    letterSpacing: 1,
  },
  best: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.textFaint,
    letterSpacing: 1,
  },
  completeBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  completeDone: {
    backgroundColor: '#39ff8815',
  },
});
