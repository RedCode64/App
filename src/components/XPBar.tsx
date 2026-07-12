import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, fonts } from '../theme';
import { xpProgress, MAX_LEVEL } from '../utils/xp';

interface XPBarProps {
  xp: number;
  prestigeCount: number;
}

export function XPBar({ xp, prestigeCount }: XPBarProps) {
  const progress = xpProgress(xp);
  const ratio = useSharedValue(0);

  useEffect(() => {
    ratio.value = withTiming(progress.ratio, { duration: 600 });
  }, [ratio, progress.ratio]);

  const fill = useAnimatedStyle(() => ({
    width: `${Math.max(2, ratio.value * 100)}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.level}>
          LVL {progress.level}
          {prestigeCount > 0 ? `  ◆${prestigeCount}` : ''}
        </Text>
        <Text style={styles.xp}>
          {progress.level >= MAX_LEVEL ? 'MAX — REBIRTH AVAILABLE' : `${progress.current} / ${progress.required} XP`}
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fill]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  level: {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 2,
    color: colors.yellow,
  },
  xp: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.textDim,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
