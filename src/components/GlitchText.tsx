import { useEffect } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors, fonts } from '../theme';

interface GlitchTextProps {
  text: string;
  size?: number;
  color?: string;
  intense?: boolean;
}

/**
 * Chromatic-aberration glitch: cyan and magenta copies of the text jitter
 * behind the base layer on a randomized loop.
 */
export function GlitchText({ text, size = 24, color = colors.text, intense = false }: GlitchTextProps) {
  const shift = useSharedValue(0);

  useEffect(() => {
    const amplitude = intense ? 5 : 2.5;
    shift.value = withRepeat(
      withSequence(
        withTiming(amplitude, { duration: 60, easing: Easing.linear }),
        withTiming(-amplitude, { duration: 50, easing: Easing.linear }),
        withTiming(0, { duration: 40, easing: Easing.linear }),
        withDelay(intense ? 350 : 1800, withTiming(0, { duration: 1 })),
      ),
      -1,
      false,
    );
  }, [shift, intense]);

  const cyanStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shift.value }, { translateY: -shift.value * 0.4 }],
    opacity: shift.value === 0 ? 0 : 0.85,
  }));
  const magentaStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -shift.value }, { translateY: shift.value * 0.4 }],
    opacity: shift.value === 0 ? 0 : 0.85,
  }));

  const base: TextStyle = {
    fontFamily: fonts.mono,
    fontWeight: '700',
    fontSize: size,
    letterSpacing: 2,
  };

  return (
    <View>
      <Animated.Text style={[base, styles.layer, { color: colors.cyan }, cyanStyle]} numberOfLines={1}>
        {text}
      </Animated.Text>
      <Animated.Text style={[base, styles.layer, { color: colors.magenta }, magentaStyle]} numberOfLines={1}>
        {text}
      </Animated.Text>
      <Text style={[base, { color }]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
