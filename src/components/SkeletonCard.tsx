import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';

/** Pulsing placeholder while async data loads. */
export function SkeletonCard() {
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 600 }), withTiming(0.35, { duration: 600 })),
      -1,
      true,
    );
  }, [pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={[styles.card, animated]}>
      <View style={styles.lineWide} />
      <View style={styles.lineNarrow} />
      <View style={styles.lineMid} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
    gap: 10,
  },
  lineWide: {
    height: 14,
    width: '70%',
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  lineNarrow: {
    height: 10,
    width: '40%',
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  lineMid: {
    height: 10,
    width: '55%',
    backgroundColor: colors.border,
    borderRadius: 3,
  },
});
