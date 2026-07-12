import { memo, useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { colors } from '../theme';

const CELL = 44;

/**
 * Subtle scrolling synthwave grid rendered behind screen content. Two stacked
 * copies of the horizontal lines translate downward and loop seamlessly.
 */
export const AnimatedGridBackground = memo(function AnimatedGridBackground() {
  const { width, height } = useWindowDimensions();
  const scroll = useSharedValue(0);

  useEffect(() => {
    scroll.value = withRepeat(withTiming(CELL, { duration: 3200, easing: Easing.linear }), -1, false);
  }, [scroll]);

  const movingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scroll.value }],
  }));

  const verticals = Array.from({ length: Math.ceil(width / CELL) + 1 }, (_, i) => i * CELL);
  const horizontals = Array.from({ length: Math.ceil(height / CELL) + 2 }, (_, i) => i * CELL - CELL);

  return (
    <View pointerEvents="none" style={styles.container}>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        {verticals.map((x) => (
          <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={height} stroke={colors.cyan} strokeWidth={0.5} />
        ))}
      </Svg>
      <Animated.View style={[StyleSheet.absoluteFill, movingStyle]}>
        <Svg width={width} height={height + CELL}>
          {horizontals.map((y) => (
            <Line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} stroke={colors.magenta} strokeWidth={0.5} />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.07,
  },
});
